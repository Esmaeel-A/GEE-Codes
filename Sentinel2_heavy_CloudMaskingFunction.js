

// Set the function parameters

var StartDate = '2019-01-01'
var EndDate = '2020-12-31'
var cloudThreshold = 40
var region = MY // table


// call the function
var CloudFreeS2 = GetS2CloudFree(StartDate, EndDate, cloudThreshold, region);

// set vizualization
var TColorS2Vis =  {'bands': ['B4', 'B3', 'B2'], 'min': 0, 'max': 3000};
// add to the map                   
Map.addLayer(CloudFreeS2, TColorS2Vis , 'Cloud Free S2');
 
 
// The function
// function to mask cloud and shadow from S2_SR based on cloud probability

//#####################################################################################
//#####################################################################################
//#####################################################################################
//#####################################################################################
 
function GetS2CloudFree(StartDate, EndDate, cloudThreshold, region, clipToRegion){


//  for default behavior
if (cloudThreshold === undefined) {
  cloudThreshold = 30;
} else {}
if (clipToRegion === undefined) {
  clipToRegion = true;
} else {}


// Function to filter collection
function Collection(collection_name) {
  var Collec = ee.ImageCollection(collection_name)
        .filterBounds(region)
        .filterDate(StartDate, EndDate);
  return Collec;
}


// get SR collection and cloud probability and join
var S2_Cprobability = ee.ImageCollection(ee.Join.saveFirst('least_cloud')
                     .apply({'primary': Collection('COPERNICUS/S2_SR').filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', 99)),
                     'secondary': Collection('COPERNICUS/S2_CLOUD_PROBABILITY'), 
                     'condition': ee.Filter.equals({'leftField': 'system:index','rightField': 'system:index'})
                           }));
                           

function CloudAndShadowF(img) {
// get image with cloud probability
      // get probability
    var cld_prb = ee.Image(img.get('least_cloud')).select('probability');

    // filter for cloud probability threshold 
    var cloud_prob = cld_prb.gt(cloudThreshold).rename('clouds');

    // add to the image
    var S2_cloud_prob = img.addBands(ee.Image([cld_prb, cloud_prob]));

// get image with dark pixel, shadows and cloud projection 
     // land pixels from classification band
    var not_water = S2_cloud_prob.select('SCL').neq(6);

    // shadowed pixels based on near infrared band threshold
    var shadowed = S2_cloud_prob.select('B8').lt(1500).multiply(not_water).rename('shadowed');

    // direction of the cloud shadow based on the solar azimuth angle
    var shadow_dir = ee.Number(90).subtract(ee.Number(S2_cloud_prob.get('MEAN_SOLAR_AZIMUTH_ANGLE')));

    // assum distance for shadow and project it
    var Cl = (S2_cloud_prob.select('clouds').directionalDistanceTransform(shadow_dir, 10)
        .reproject({'crs': S2_cloud_prob.select(0).projection(), 'scale': 100})
        .select('distance')
        .mask()
        .rename('cloud_transform'));

    // intersection of dark pixels with cloud shadow projection
    var shadows = Cl.multiply(shadowed).rename('shadows');

    // Add as bands
    var M_CloudAndShadow = S2_cloud_prob.addBands(ee.Image([shadowed, Cl, shadows]));


// mask cloud and shadow (adapted)
    // set binary mask for cloud and shadow 
    var CloudAndShadow = M_CloudAndShadow.select('clouds').add(M_CloudAndShadow.select('shadows')).gt(0);

    // # Remove small cloud-shadow patches and dilate remaining pixels by BUFFER input.
    // # 20 m scale is for speed, and assumes clouds don't require 10 m precision
    //"parameters kept from original code"
    CloudAndShadow = (CloudAndShadow.focal_min(2).focal_max(5)
        .reproject({'crs': img.select([0]).projection(), 'scale': 20})
        .rename('cloudmask'));

    // Add the mask 
    
    var vmedium = M_CloudAndShadow.addBands(CloudAndShadow);

    var masked = vmedium.select('cloudmask').not();

    return vmedium.select('B.*').updateMask(masked);
}

var CfreeComposite = S2_Cprobability.map(CloudAndShadowF)
                             .median();

//center and set zoom level //important for large scale to avoid memory issues
Map.centerObject(region, 15);

// clip if it's true
if (clipToRegion === true) {
  CfreeComposite = CfreeComposite.clip(region);
} else {}


return CfreeComposite}




