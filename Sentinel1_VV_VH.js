
var StartDate = '2020-01-01';
var EndDate   = '2021-12-31';

var region = MY //table

//clipfunction 
var clip = function(image){
  return image.clip(region);
};

// Import Sentinel 1 Collection and filter 
var collection_S1_IW_ASC = ee.ImageCollection('COPERNICUS/S1_GRD').filterBounds(region)
                       .filter(ee.Filter.eq('instrumentMode', 'IW')) //to get the imagery collected in interferometric wide (IW) swath mode
                       .filterDate(StartDate, EndDate)
                       // Filter for ascending orbit
                       //.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
                       // Filter for descending
                       //.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));
                       .map(clip);
                       
                       
// Filter for VV and VH dual polarization and composite for median
var S1_MedianASC_VV = collection_S1_IW_ASC.filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV')).select('VV').median();
var S1_MedianASC_VH = collection_S1_IW_ASC.filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH')).select('VH').median();


// Display the filtered imagery
Map.addLayer(collection_S1_IW_ASC, {'bands': 'VV,VH,VV', min: [-15, -25, -15],max: [0, -5, 0]}, 'Sentinel-1 IW VV,VH,VV false color',false);
Map.addLayer(S1_MedianASC_VV, {'bands': 'VV', min: -15, max: 5}, 'S-1 Median Asc VV');
Map.addLayer(S1_MedianASC_VH, {'bands': 'VH', min: -25, max: 5}, 'S-1 Median Asc VH');

