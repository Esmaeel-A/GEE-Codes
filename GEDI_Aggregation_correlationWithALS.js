//##################################################################################################             
               //         ## Code for VAlidating GEDI against given CHM ##
//##########################################    #################################################### 
//####################################       by        #############################################
//                                     Esmaeel Adrah
//#################  Earth observation center, Institute of climate change, UKM  ###################
//######################   20/4/2022        #####       esmaeelad@gmail.com   ######################

//##################################################################################################
//##################################################################################################
//##################################################################################################


//Description
               
// The script default examine a chosen  GEDI metric based on IMPORTED CHM, and:
//   1. Allow control over aggregation methods, resampling resolutions and applied filters
//   2. Calculate GEDI spatial coverage statistic for the given site
//   3. Calculate GEDI and CHM basic statistic for the given site and plot Box plot
//   4. Charting scatter plot of GEDI and CHM
//   5. Calculating  5.1correlation vlaue, 5.2P-value, 5.3RMSE, 5.4rRMSE %, and 5.5 Absolute mean error



// The optional and additonal outputs of the script can allow control for comparing multiple GEDI metrics and resolutions,  and:
//   6. Calculate additional statistics for GEDI and CHM 
//   7. Listing the values of ALL CHM and GEDI hegihts
//   8. Linear fit Values
//   9. Histogram of GEDI and CHM 
//  10. Histogram of Elevation and Slope


//##################################################################################################         
//##################################################################################################
       
        // STEP 1        ##       #IMPORT DATA#         ##
             
             //#1.1 Import CHM and call it 'CHM' 
                // Note: if CHM is large (~ > 200km2), GEE memory limits will be exceeded 
                  // clipping the CHM to smaller parts is recommended in this case
             
             //Optional
             
             //#1.2 (optional : SRTM is a default if not imported)  Import DEM and and call it 'DEM'
             //#1.3 (optional : no default required)  Import Polygon to determin CHM data extent and call it 'CHMpoly'
             //#1.4 (optional : no default required)  Import FOREST polygon to clip GEDI and call it 'ForestPoly'
             
//##################################################################################################         
   
        // STEP 2        ##       #SET Parameters and filters#         ##
              
              //#### GEDI ################################################
             //#2.1 Set the used gedi metric and prefered sampling resolution (the grid cell size in m)
             var Cellsampling = 25;  // [Options: Anything... 25, 30, 90, 250, 1000] 
             var ChosenMetric = 95;     //  [Options: Any GEDI metric: 0, 1, 2, 3 ... 90, 98, 100]
            
             //#2.2 Set the GEDI filters parameters
             
             // Coverage filter 
             var edge = 25 // the inner buffer from CHM boundary to eliminate GEDI shots on the edge 
             var l8_treecover = 70 // filter for forest shots based on landsat tree cover ( > 70% probability for identifying forest cover)

             // Quality filter 
             var quV = 1    // accepted quality_flag value (0 invalid or 1 valid)
             var degrV = 0  //   accepted degredation threshold value
             var sensMin = 0.9  // minimum accepted sensitivity value
             var S_elv = 360  // filter for shots acquired at night only ( 0 for night shots --- 360 for all shots)
             
             var FilterCoverageBeam = 'no' // [Options: 'yes' Or 'no']  // filter for power beams only
                                             // [Coverage beams: (0000 >> 0), (0001 >> 1), (0010 >> 2), (0011 >> 3 )]
                                             // [Power beams:    (0101 >> 5), (0110 >> 6), (1000 >> 8), (1011 >> 11)]

             // Outlier filter
             var Hmax = 90
             var Hmin = 2
             
             // Elevation attributes filter
             var Filterslope = 'yes' // [Options: 'yes' Or 'no'] Slope filter ...if yes.. choose threshold value
                    var SlopeFilterValue = 30 
             var FilterElev = 'no'  // [Options: 'yes' Or 'no'] Elevation filter ...if yes.. choose threshold value
                    var ElevationFilterValue = 1000
             
              //#### CHM ##################################################
             //#2.3 Set the CHM aggregation  when gridding into lower resolution grid for comparing with GEDI
             var CHMagg = 'CHM'+CHMpercentile+''//'CHMmean'//  [Options: CHMmean or CHMpercentile]
             var CHMpercentile = 95;  // in case percentile [Options: 50, 90, 95, 100....]
             // Outlier filter for CHM
             var CHMmax = 90
             var CHMmin = 2
             
             //#### Aggregation method ####################################
             //#2.4 Set the validation method for  CHM Vs GEDI comparison
             var GEDI_validation_method = 'FP' //  [Options: 'FP' or 'GC'] This defines how GEDI will be compared to CHM
             //'FP': At footprint level: Only CHM will be aggregated to the Grid cell size using the different methods, the values will be extracted at the gedi footprint level for comparison
             //'GC': At grid cell level: (only relevant when using >50m grid cell size) both the CHM and GEDI values will be aggregated to the grid cell cize and the comparison will be held at the grid cell size
                    // in case aggregation GC:
                    //#2.4.1 set the GEDI aggregation method
                       var GEDIAggregationMethod  = 'M' // [Options: 'M' Or 'P' ] M: mean aggregation, P: percentile aggregation   
                          // incase percetnile:
                             var GEDIpercentile = 95;  // [Options: 90, 95, 100] This is aggregation percentile NOT GEDI metric
            
            
             
              //#### Control output ######################################
              //# 2.4 Printing outputs
              
              
              //#2.4.1  Basic summary statistics for GEDI and CHM in the area 
                 
              // Calcluate mean, max, min for GEDI and CHM in the site
              var Printbasicstat = 'no'  //  [Options: 'yes' Or 'no']
              
              // GEDI spatial coverage statistics
              var GEDIshotsCoverage = 'yes'   //  [Options: 'yes' Or 'no']
                    var AdditionalCoveragestat = 'no' //  [Options: 'yes' Or 'no']
                    
                    
              //#2.4.2 print boxplot of CHM and GEDI hegihts
              var Printboxplot = 'yes'   //  [Options: 'yes' Or 'no']
              
              //#2.4.3 Print Pixel Values 
              var PrintPixelVCHM = 'no' //  [Options: 'yes' Or 'no']

              //#2.4.4 print correlation Chart 
              var PrintCorCharts = 'yes'   // [Options: 'yes' Or 'no']
              
              //#2.4.5 print Histogram
              var PrintHisto = 'yes'   //  [Options: 'yes' Or 'no']
              
              //#2.4.6 print slope and elevation histo
              var ElevHisto = 'yes'   //  [Options: 'yes' Or 'no']
             
             
             //#### Control colors and Vizualizations ####################
             
             //#2.5 Map Vizualizations : Height viz parameters
              
              var Vis = {min: 1,max: 80, palette: 'darkblue,red,orange,green,darkgreen',};
 
             //#2.6 Charts Vizualization
             
              // #2.4.1 Boxplot color                          25        30       90       250        1000
              var Bpcolor = '999900'// [Options: Anycolor... 'green' , 'orange', '2ECCFA', '2d4051', '999900' ]
              // #2.4.2 Scatterplot color  
              var Chcolor = '999900'//[Options: Anycolor... '234f1c' , 'b27b18', '2ECCFA', '2d4051', '999900' ]
              // #2.4.3 Hisatogram colors
              var HC1 = 'f0af07'   //[Options: Anycolor...'f0af07','green', 'Magenta', 'black', 'cf513e', '1d6b99']         
              var HC2 = 'Magenta'   //[Options: Anycolor...'f0af07','green', 'Magenta', 'black', 'cf513e', '1d6b99']
              
       
//##################################################################################################         
//##################################################################################################
//###############################          RUN THE CODE                   ##########################         
//##################################################################################################
//##################################################################################################


//             ####  Set the map and clipping parameters ####



//Center the map
Map.centerObject(CHM);

//Get the buffered poly from the CHM extent as an additional edge filter for GEDI data
var CHMpolygon = CHM.geometry();  //geometry()
var CHMpolyBuffer = CHMpolygon.buffer({'distance': -edge});

//clipfunction for the inner CHM buffer
var clipToCHM = function(image){
  return image.clip(CHMpolyBuffer);
};

////##################################################################################################

//                  ###  Get and filter the data ###


//  filter mask function for GEDI data  
var filter = function(im) {
  return im.updateMask(im.select('quality_flag').eq(quV)) 
      .updateMask(im.select('degrade_flag').lte(degrV))    
      .updateMask(im.select('sensitivity').gt(sensMin))
      .updateMask(im.select('rh'+ChosenMetric+'').gt(Hmin))
  .updateMask(im.select('rh'+ChosenMetric+'').lt(Hmax))
    .updateMask(im.select('solar_elevation').lte(S_elv))
    .updateMask(im.select('landsat_treecover').gt(l8_treecover))
};

var Coveragebeamfilter = function(im) {
  return im.updateMask(im.select('beam').gt(4))
}

// GEDI data + Filter the shots with distance < 25m from the edge by clipping to inner buffer poly
var GEDIdata = ee.ImageCollection('LARSE/GEDI/GEDI02_A_002_MONTHLY').filterBounds(CHMpolygon)
                  .map(filter).map(clipToCHM)
                  ;
    
if (FilterCoverageBeam == 'yes') {

var GEDIdata = GEDIdata.map(Coveragebeamfilter);
} else {}
    
    

           
           
// Filter CHM data
var CHM = CHM.updateMask(CHM.select('b1').gt(CHMmin)).updateMask(CHM.select('b1').lt(CHMmax));

   
     
//select the GEDI chosen metrics for the stat
var GEDIrhStat = GEDIdata.max().updateMask(CHM).select('rh'+ChosenMetric+'');
//##################################################################################################


//                  ###  Making a grid (fishnet) to aggregate the data into ###


// Geometry of the CHM inner buffer (area of interest)
var polygon = CHMpolyBuffer;

// Create a Feature from the Geometry.
var polyFeature = ee.Feature(polygon, {id : 1});

// Get projection of reference image (here we use GEDI projection)
var proj = GEDIdata.first().projection();



// Use the geometry to bound the grid, the projection to define orientation and cell sampling resolution for the size
var grid = polyFeature.geometry().coveringGrid(proj,Cellsampling);

     //selecting the grid according to the GEDI aggregation method
if (GEDI_validation_method == 'FP') {
  //making GEDIgrid at the cell sampling size same as grid
  var GEDIgrid = polyFeature.geometry().coveringGrid(proj,25);
} else {
  // making grid for GEDI footprint at 25m
  var GEDIgrid = grid;
}

////##################################################################################################

//                  ###  Get Elevation attributes ###

if(DEM === undefined){
  print("DEM not defined, used default DEM as SRTM 30m")
    var DEM = ee.Image('USGS/SRTMGL1_003').rename('DEM')}
    else {
    var DEM = DEM.rename('DEM')}

 // Importing module https://github.com/zecojls/tagee
var TAGEE = require('users/joselucassafanelli/TAGEE:TAGEE-functions');
  // Smoothing filter
var gaussianFilter = ee.Kernel.gaussian({
  radius: 3, sigma: 2, units: 'pixels', normalize: true
});
// Smoothing the DEM with the gaussian kernel.
var DEM = DEM.convolve(gaussianFilter).resample("bilinear");
var DEMAttributes = TAGEE.terrainAnalysis(TAGEE, DEM, CHMpolygon)
var k = proj.nominalScale()
 DEMAttributes = DEMAttributes.reproject(proj);
 DEMAttributes = DEMAttributes.select("Elevation", "Slope", "Aspect", "MeanCurvature")

//##################################################################################################

//                  ###  Functions for Basic statistic of the data ###


//function to Calculate area per pixel 
var CalcArea = function(Poly, scale){
               var area = ee.Image.pixelArea().divide(1000000);
               var arre = area.reduceRegion({
                geometry: Poly,
                reducer: ee.Reducer.sum(),
                scale: scale,
                maxPixels: 1e13});
   print('Coverage area in km',arre)};


//function to Get basic stat(min, max, mean) from image
var CalcImStat = function(Image, Poly, scale){
               var mean = ee.Number(Image.reduceRegion({geometry: Poly,reducer: ee.Reducer.mean(),scale: scale,maxPixels: 1e13}));
               var max = ee.Number(Image.reduceRegion({geometry: Poly,reducer: ee.Reducer.max(),scale: scale,maxPixels: 1e13}));
               var min = ee.Number(Image.reduceRegion({geometry: Poly,reducer: ee.Reducer.min(),scale: scale,maxPixels: 1e13}));
   print('mean ,  max  ,  min',mean, max, min)};


//function to Get basic stat(min, max, mean) from featurecollection
var CalcFcStat = function(Fcollection, Property){
               var mean = ee.Number(Fcollection.reduceColumns(ee.Reducer.mean(), [Property]).get('mean'));
               var max = ee.Number(Fcollection.reduceColumns(ee.Reducer.max(), [Property]).get('max'));
               var min = ee.Number(Fcollection.reduceColumns(ee.Reducer.min(), [Property]).get('min'));
               var count = ee.Number(Fcollection.reduceColumns(ee.Reducer.count(), [Property]).get('count'));

   print('mean ,  max  ,  min  , count',mean, max, min, count)};
   



//##################################################################################################

//                  ###  Add raw data, stats, and the grid to the map ###


// Add raw data to the map
Map.addLayer(GEDIdata.max().updateMask(CHM), {}, 'GEDI_raw gridded', false);  // GEDI gridded

Map.addLayer(CHM, Vis, 'CHM', false); // CHM

// Add the grid
Map.addLayer(grid, {}, 'grid', false);

Map.addLayer(DEMAttributes, {}, 'Elevation attributes', false)

// Print the area and basic stat for GEDI and CHM, 'if you need to '
if (Printbasicstat == 'yes') {
  CalcArea(CHMpolygon,1);  // The Area in km
  CalcImStat(GEDIrhStat, CHMpolygon, 25);  // Mean, Max, Min GEDI
  CalcImStat(CHM, CHMpolygon, 1);  // Mean, Max, Min CHM
} else {}


//##################################################################################################


//                  ###  Aggregate the heights from CHM and GEDI to the grid in different methods###


//Aggregate the heights from the CHM to the grid using percentiles then mean and the scale of the actual CHM chm (1m here)


var CHMaggreg = function(ppp){
  if (ppp  == 'mean') {
      var Agg_CHM = CHM.reduceRegions({collection: grid,reducer: ee.Reducer.mean(),scale: 1,});
      // Reduce the Grddid CHM back to images and stack
      Agg_CHM = Agg_CHM.select('mean').reduceToImage(['mean'], ee.Reducer.first());
      // Rename the property of each image
      Agg_CHM = Agg_CHM.select(['first'],['CHMmean']);
} else {
       Agg_CHM = CHM.reduceRegions({collection: grid,reducer: ee.Reducer.percentile([ppp], ['p'+ppp+'']),scale: 1,});
      // Reduce the Grddid CHM back to images and stack
      Agg_CHM = Agg_CHM.select('p'+ppp+'').reduceToImage(['p'+ppp+''], ee.Reducer.first());
      // Rename the property of each image
      Agg_CHM = Agg_CHM.select(['first'],['CHM'+ppp+'']);
     }
     return Agg_CHM};


// Aggregate CHM per grid cell using different methods
 var Agg_CHM = CHMaggreg(CHMpercentile);


//Aggregate the GEDI heights to the grid using percentiles or mean and the scale of the actual GEDI cell (25m here)
if (GEDI_validation_method == 'FP'){
    var GEDIaggregation = function(metric){
  var GEDIm = GEDIdata.max().updateMask(CHM).select('rh'+metric+'');
  GEDIm = GEDIm.reduceRegions({collection: GEDIgrid,reducer: ee.Reducer.mean().unweighted(),scale: 25,});
  // Reduce the Grddid GEDI back to images and stack
  GEDIm = GEDIm.select('mean').reduceToImage(['mean'], ee.Reducer.first());
  // Rename the property of each image
  GEDIm = GEDIm.select(['first'],['GEDI'+metric+'']);
  return GEDIm};
} else if (GEDIAggregationMethod  == 'M') {
  var GEDIaggregation = function(metric){
  var GEDIm = GEDIdata.max().updateMask(CHM).select('rh'+metric+'');
  GEDIm = GEDIm.reduceRegions({collection: GEDIgrid,reducer: ee.Reducer.mean().unweighted(),scale: 25,});
  // Reduce the Grddid GEDI back to images and stack
  GEDIm = GEDIm.select('mean').reduceToImage(['mean'], ee.Reducer.first());
  // Rename the property of each image
  GEDIm = GEDIm.select(['first'],['GEDI'+metric+'']);
  return GEDIm};
} else {
  var GEDIaggregation = function(metric){
  var GEDIm = GEDIdata.max().updateMask(CHM).select('rh'+metric+'');
  GEDIm = GEDIm.reduceRegions({collection: GEDIgrid,reducer: ee.Reducer.percentile([GEDIpercentile], ['p'+GEDIpercentile+'']).unweighted(),scale: 25,});
  // Reduce the Grddid GEDI back to images and stack
  GEDIm = GEDIm.select('p'+GEDIpercentile+'').reduceToImage(['p'+GEDIpercentile+''], ee.Reducer.first());
  // Rename the property of each image
  GEDIm = GEDIm.select(['first'],['GEDI'+metric+'']);
  return GEDIm};}

// Aggregate GEDI per cell for each metric of interest
var Agg_GEDI = GEDIaggregation(ChosenMetric);


// Mask to avoid missing values and add bands from one to another 
var Masked_CHM = Agg_CHM.mask(Agg_GEDI);

var Slope = DEMAttributes.select("Slope")
var Elevation = DEMAttributes.select("Elevation")
var CorAll = Masked_CHM.addBands(Agg_GEDI).addBands(Slope).addBands(Elevation)

var CorAll = CorAll.updateMask(CorAll.select('CHM'+CHMpercentile+'').gt(0));

if (Filterslope == 'yes') {
 //Slope filter
 var CorAll = CorAll.updateMask(CorAll.select('Slope').lt(SlopeFilterValue));
} else {}
if (FilterElev == 'yes') {
//Elevation filter
var CorAll = CorAll.updateMask(CorAll.select('Elevation').lt(ElevationFilterValue));
} else {}


// Add the aggregated grid to the map
Map.addLayer(CorAll, {min: 1,max: 80}, 'Aggregated CHM & GEDI', false);

//##################################################################################################

//                            ###  Check GEDI Coverage ####

if (GEDIshotsCoverage == 'yes') {
 // Number of shots in the region of interest before anyfilter
  var GEDIraw = ee.ImageCollection('LARSE/GEDI/GEDI02_A_002_MONTHLY').max().select('rh'+ChosenMetric+'');
  var Nshots = ee.Number(GEDIraw.reduceRegion({geometry: polygon,reducer: ee.Reducer.count(),scale: 25,}).get('rh'+ChosenMetric+''));
  print('Actual N. of GEDI shots in the region before filtering:', Nshots);


 // Number of shots in the region of interest (after filter)
  var Nshots = ee.Number(GEDIrhStat.reduceRegion({geometry: polygon,reducer: ee.Reducer.count(),scale: 25,}).get('rh'+ChosenMetric+''));
  print('Actual N. of GEDI shots in the region after filtering:', Nshots);

 // Sample size
 var Ssize = CorAll.select(['GEDI'+ChosenMetric+'']);
 
 
 var SsizeFP = ee.Number(Ssize.reduceRegion({geometry: polygon,reducer: 'count',scale: 25,}).get('GEDI'+ChosenMetric+''));
 var SsizeGC = ee.Number(Ssize.reduceRegion({geometry: polygon,reducer: 'count',scale: Cellsampling,}).get('GEDI'+ChosenMetric+''));



 
    // Number of GEDI shots per grid cell in the etire region
    var grid1km = polyFeature.geometry().coveringGrid(proj,1000);
   var FCshotsPerCell = GEDIrhStat.reduceRegions({collection: grid1km,reducer: ee.Reducer.count(),scale: 25,});
   var NshotsPerCell = ee.Number(FCshotsPerCell.reduceColumns(ee.Reducer.mean(), ['count']).get('mean'));
   print('Average N. of shots per 1km cell', NshotsPerCell);
  
  if (AdditionalCoveragestat == 'yes') {
   // Number of GEDI shots per grid cell when there is coverage only
   var filterNshotsPerCell = FCshotsPerCell.filter(ee.Filter.gt('count', 0));
   // get the stats (mean, max, min) of the shot coverage 
    print('Stat of the N. of shots Coverage per 1km cell (In the sampled cells):');
    CalcFcStat(filterNshotsPerCell, 'count');
// number of cell in the grid
  var Ncell = ee.Number(Agg_CHM.reduceRegion({geometry: polygon,reducer: 'count',scale: Cellsampling,}).get('CHM'+CHMpercentile+''));
  print('N. of '+Cellsampling+'m2 cells in the grid:', Ncell);

//if method FP the scale is 25, otherwise it's Cellsampling
 if (GEDI_validation_method == 'FP') {
    print('Gridded sample size(To GEDI footprint):', SsizeFP);
  } else {
    print('Gridded sample size(To Gridded Cells):', SsizeGC);
 
  } 
} else {}

var Ged = CorAll.select(['GEDI'+ChosenMetric+'']);
var GedName = Ged.bandNames();


        
} else {}

//##################################################################################################

//                            ###  Chart the heights in Boxplots ####

// Boxplot function to plot image bands
function boxPlotChart(image, xLabels, percentiles) {
  var reducer2 = ee.Reducer.mean().setOutputs(['main']).combine({ reducer2: ee.Reducer.percentile(percentiles), sharedInputs: true });
  var data = image.reduceRegion({ reducer: reducer2, geometry: CHM.geometry(), scale: Cellsampling,
  maxPixels: 1e13 });

  var cols = [
    {id: 'x', type: 'string' },
    {id: 'y', type: 'number'}
  ];
  
  cols = cols.concat(percentiles.map(function(p) {
    return { id: 'p' + p, type: 'number', role: 'interval' };
  }));
  
  var values = ee.List(xLabels).map(function(x) {
    var v = ee.List([x, data.get(ee.String(x).cat('_main'))]);

    v = v.cat(percentiles.map(function(p) {
      return data.get(ee.String(x).cat('_p' + p));
    }));
    
    return v;});
    
  values = values.getInfo();
  
  var dataTable = {
    cols: cols,
    rows: values.map(function(row) {
      return { c: row.map(function(o) { return { v: o } }) };
    })
  };
  
// Set boxplot options

 var options = {
          title:'Heights Box Plots at '+Cellsampling+'m sampling reslution',
          curveType:'function', 
          height: 500,
          legend: {position: 'none'},
          hAxis: {
            gridlines: {color: '#fff'}
          },
          lineWidth: 0,
          series: [{'color': Bpcolor}],//'234f1c', 'orange', '2ECCFA', '2d4051', '999900'
          intervCHM: {
            barWidth: 0.5,
            boxWidth: 1,
            pointSize: 2,
            lineWidth: 0.2,
            style: 'boxes'
          },
          interval: {
            max: {
              style: 'bars',
              fillOpacity: 1,
              color: '#555'
            },
            min: {
              style: 'bars',
              fillOpacity: 1,
              color: '#755'
            }
          }
      };

  return ui.Chart(dataTable, 'LineChart', options);
}  
var percentiles = [0, 25, 75, 100];
var GEDI_CHM = CorAll.select('CHM'+CHMpercentile+'', 'GEDI'+ChosenMetric+'')

var bandsName = GEDI_CHM.bandNames();
var boxplotC = boxPlotChart(GEDI_CHM, bandsName, percentiles);

// Print the area and basic stat for GEDI and CHM, 'if you need to '
if (Printboxplot == 'yes') {
  print(boxplotC);
} else {}


//##################################################################################################


//                                ###  Correlation ###
//                  ###  Extract values, Chart and check correlation ###

// Extracting pixel values
if (GEDI_validation_method == 'FP') {
  var pixelVCHM = CorAll.reduceRegion(
    {reducer: ee.Reducer.toList(), geometry: polyFeature.geometry(), scale: 25});
} else {
  var pixelVCHM = CorAll.reduceRegion(
    {reducer: ee.Reducer.toList(), geometry: polyFeature.geometry(), scale: Cellsampling});
}

// print the dictionary object to the console to check observations
if (PrintPixelVCHM == 'yes') {
  print('pixel values Object:', pixelVCHM);
} else {}

 

// Prepare values to be plotted along x axe
var x = ee.List(pixelVCHM.get('CHM'+CHMpercentile+''));

// function to chart values along y axe as a function of GEDI metric

var correlationChart = function(GEDImet){

// Get values from dictionary and make lists
var y = ee.List(pixelVCHM.get(GEDImet));

// Define the chart and set options
var chartCorrle = ui.Chart.array.values({array: y, axis: 0, xLabels: x}).setOptions({
  title: 'Correlation '+GEDImet+' & '+'CHM'+CHMpercentile+''+'  aggregated to '+Cellsampling+'m pixel',
  colors: [Chcolor],//'green', 'orange', '2ECCFA', '2d4051', '999900'
  hAxis: {
    title: 'CHM ',
    titleTextStyle: {italic: false, bold: true},
    gridlines: {color: 'FFFFFF'},
    viewWindow: {min: 0, max: 100}},
  vAxis: {
    title: 'GEDI',
    titleTextStyle: {italic: false, bold: true},
    gridlines: {color: 'FFFFFF'},
    baselineColor: {color: 'FFFFFF'},
    viewWindow: {min: 0, max: 100}},
  pointSize: 3,
  pointShape: 'circle', //'diamond', 'triangle', 'square', 'star', or 'polygon'
  dataOpacity: 0.4,
legend: {position: 'none'},
  trendlines: { 0: {  // add a trend line to the 1st series
      type: 'linear',  // or 'polynomial', 'exponential', 'linear'
      color: 'red',
      lineWidth: 1,
      visibleInLegend: true},
      1: {showR2: true, visibleInLegend: true, color: '2d4051', lineWidth: 4,
  lineDashStyle: [4, 4]} },

  chartArea: {backgroundColor: 'EBEBEB'}
});

return chartCorrle};


// sample the stack from the image
var sample = CorAll.sample({'region':polyFeature.geometry(), 
                            'scale': 25});
var correl = ee.Reducer.pearsonsCorrelation();
// Get Correlation values
var CorrelationV = function(GEDImet){
// Set the correlation properties
var CorrelV = sample.reduceColumns(correl, [GEDImet, 'CHM'+CHMpercentile+'']);



return CorrelV;};


//##################################################################################################


//                  ###  Calculate RMSE, rRMSE, and delta ###

// transfer the values to arrays
var N = ee.Array(x);



// get the values as a function for GEDI metric

var y = ee.List(pixelVCHM.get('GEDI'+ChosenMetric+''));
var NN = ee.Array(y);

// Calculate the RMSE
var RMSE = (N.subtract(NN)).pow(2);       // array calculations
RMSE = RMSE.reduce('sum', [0]).get([0]);  // reduce the array to the sum -> output is a ee.Number()
RMSE = RMSE.divide(N.length().get([0]));    // divide by the amount of observations
RMSE = RMSE.sqrt();                       // Get the RMSE


//rRMSE
// Average value of CHM observed
var avCHM = N.reduce('mean', [0]).get([0]);
var rRMSE = RMSE.divide(avCHM);

// Calculate the delta Mean
var d = N.subtract(NN);
 d = d.abs();
 d = d.reduce('mean', [0]).get([0]);



//Get the correlation values
var cor = CorrelationV('GEDI'+ChosenMetric+'');
var correV = ee.Number(cor.get('correlation'));
var pVal = ee.Number(cor.get('p-value'));


//##################################################################################################

var testCor = function(GEDImet){


//Conditional printing for Linearfit
if (PrintCorCharts == 'yes') {
  print(correlationChart(GEDImet));
} else {}



//Printing the results
print('CorreV, pVal, RMSE, rRMSE, AME:', correV, pVal, RMSE, rRMSE, d);
};



testCor('GEDI'+ChosenMetric+'')





//##################################################################################################


//                  ### Chart the heights in Histogram ###
var select = CorAll.select(['CHM'+CHMpercentile+'', 'GEDI'+ChosenMetric+'']);
var bandsName = select.bandNames();

// Define the chart and print it to the console.
var Histo =
    ui.Chart.image.histogram({image: select, region: CHM.geometry(), scale: Cellsampling})
        .setSeriesNames(bandsName)
        .setOptions({
          title: 'GEDI Vs CHM Histogram',
          hAxis: {
            title: 'Heights',
            titleTextStyle: {italic: false, bold: true},
          },
          vAxis:
              {title: 'Count', titleTextStyle: {italic: false, bold: true}},
          colors: [HC1, HC2, 'f0af07','green', 'Magenta', 'black', 'cf513e', '1d6b99'],
          histogram: {
            bucketSize: 30,
             },
          lineWidth: 2,
        });
if (PrintHisto == 'yes') {
  print(Histo);
} else {}


//##################################################################################################

var Slo = DEMAttributes.select(['Slope']);
var bandsName2 = Slo.bandNames();

// Define the chart and print it to the console.
var Histo2 =
    ui.Chart.image.histogram({image: Slo, region: CHM.geometry(), scale: Cellsampling})
        .setSeriesNames(bandsName2)
        .setOptions({
          title: 'Slope Histogram',
          hAxis: {
            title: 'Heights',
            titleTextStyle: {italic: false, bold: true},
          },
          vAxis:
              {title: 'Count', titleTextStyle: {italic: false, bold: true}},
          colors: [HC1, HC2, 'f0af07','green', 'Magenta', 'black', 'cf513e', '1d6b99'],
          histogram: {
            bucketSize: 2,
             },
          lineWidth: 2,
        });


var Elv = DEMAttributes.select(['Elevation']);
var bandsName3 = Elv.bandNames();

// Define the chart and print it to the console.
var Histo3 =
    ui.Chart.image.histogram({image: Elv, region: CHM.geometry(), scale: Cellsampling})
        .setSeriesNames(bandsName3)
        .setOptions({
          title: 'Elevation Histogram',
          hAxis: {
            title: 'Heights',
            titleTextStyle: {italic: false, bold: true},
          },
          vAxis:
              {title: 'Count', titleTextStyle: {italic: false, bold: true}},
          colors: ['black', 'cf513e', '1d6b99'],
          histogram: {
            bucketSize: 2,
             },
          lineWidth: 2,
        });


if (ElevHisto == 'yes') {
  print(Histo2)
  print(Histo3);
} else {}

