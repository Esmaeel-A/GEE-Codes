
//##################################################################################################             
               //       ## Code for VAlidating GEDI against ALS ##
               
               
               
// The script default output are:
//   1.Charting scatter plots
//   2.Printing 1.1correlation vlaue, 1.2P-value, 1.3RMSE, 1.4rRMSE %, and 1.5 dleta error mean
// The defualt examine 5 GEDI metrics, namely [50,75,90,95,100] against 4 ALS aggregation method in different resolution
// The resolution, the above, and GEDI aggregation methods can be changed by setting the parameters in step 2
// The optional and additonal output of the script are:
//   3. basic summary statistics for GEDI and ALS in the area 
//   4. GEDI shots coverage statistics
//   5. Boxplot of ALL ALS and GEDI hegihts
//   6. Values of ALL ALS and GEDI hegihts
//   7. Correlation Values separetly
//   8. Linear fit Values
//   9. Correlation Charts 
//  10. Histogram of GEDI and ALS 

//##################################################################################################         
//##################################################################################################
       
        // STEP 1        ##       #IMPORT DATA#         ##
             //#1.1 Import CHM at 1m resolution and call it 'ALS'
             //#1.2 Import Polygon to determin ALS data extent and call it 'ALSpoly'
             //#1.3 Import FOREST polygon to clip GEDI and call it 'ForestPoly'

//##################################################################################################         
   
        // STEP 2        ##       #SET Parameters#         ##
        
             //#2.1 Set the sampling resolution (the grid cell size in m)
             var Cellsampling = 1000;  // [Options: Anything... 25, 30, 90, 250, 1000]

             //#2.2 Set the ALS aggregation method when gridding into lower resolution grid for comparing with GEDI
             var ALSpercentile = 90;  // in case percentile [Options: 50, 90, 95, 100]
             var ALSagg = 'ALSmean'// 'ALS'+ALSpercentile+''// [Options: ALSmean or ALSpercentile]
                 
                       
             //#2.3 Set the validation method for  ALS Vs GEDI comparison
             var GEDI_validation_method = 'FP' //  [Options: 'FP' or 'GC'] This defines how GEDI will be compared to ALS
             //'FP': At footprint level: Only ALS will be aggregated to the Grid cell size using the different methods, the values will be extracted at the gedi footprint level for comparison
             //'GC': At grid cell level: both the ALS and GEDI values will be aggregated to the grid cell cize and the comparison will be held at the grid cell size
                    // in case aggregation:
                    //#2.3.1 set the GEDI aggregation method
                       var GEDIAggregationMethod  = 'M' // [Options: 'M' Or 'P' ] M: mean aggregation, P: percentile aggregation   
                          // incase percetnile:
                             var GEDIpercentile = 90;  // [Options: 90, 95, 100] This is aggregation percentile NOT GEDI metric
                             


             
             //#2.4 Charts Vizualization
             
              // #2.4.1 Boxplot color                          25        30       90       250        1000
              var Bpcolor = '999900'// [Options: Anycolor... 'green' , 'orange', '2ECCFA', '2d4051', '999900' ]
              // #2.4.2 Scatterplot color  
              var Chcolor = '999900'//[Options: Anycolor... '234f1c' , 'b27b18', '2ECCFA', '2d4051', '999900' ]
              // #2.4.3 Hisatogram colors
              var HC1 = 'f0af07'   //[Options: Anycolor...'f0af07','green', 'Magenta', 'black', 'cf513e', '1d6b99']         
              var HC2 = 'Magenta'   //[Options: Anycolor...'f0af07','green', 'Magenta', 'black', 'cf513e', '1d6b99']
              
              //#2.5 Map Vizualizations : Height viz parameters
              
              var Vis = {min: 1,max: 80, palette: 'darkblue,red,orange,green,darkgreen',};
  
              //# 2.6 Printing outputs
              //#2.6.1  print basic summary statistics for GEDI and ALS in the area 
                 // GEDI metric to calcluate mean, max, min for the site
              var ChosenMetric = 90;     //  [Options: Any GEDI metric: 0, 1, 2, 3 ... 90, 98, 100] //This is only for the summary statistics and Histogram
              var Printbasicstat = 'yes'  //  [Options: 'yes' Or 'no']
              // GEDI shots coverage statistics
              var GEDIshotsCoverage = 'yes'   //  [Options: 'yes' Or 'no']
              //#2.6.2 print boxplot of ALS and GEDI hegihts
              var Printboxplot = 'yes'   //  [Options: 'yes' Or 'no']
              //#2.6.3 print Print Pixel Values 
              var PrintPixelVals = 'no' //  [Options: 'yes' Or 'no']
              //#2.6.4 print Correlation Values separetly
              var PrintCorVals = 'no'   //  [Options: 'yes' Or 'no']
              //#2.6.5 print linear fit Values
              var PrintLinearFit = 'no'  // [Options: 'yes' Or 'no']
              //#2.6.6 print correlation Charts 
              var PrintCorCharts = 'yes'   // [Options: 'yes' Or 'no']
              //#2.6.7 print Histogram
              var PrintHisto = 'yes'   //  [Options: 'yes' Or 'no']
              //#2.6.8 Chart at the end 
              var ChartAttheEnd = 'no'   //  [Options: 'yes' Or 'no']
             
             
       
//##################################################################################################         
//##################################################################################################
//###############################          RUN THE CODE                   ##########################         
//##################################################################################################
//##################################################################################################


//                 ####  Set the map and clipping parameters ####



//Center the map
//Map.centerObject(ALS);

//Get the buffered poly from the ALS extent as an additional edge filter for GEDI data
var ALSpolygon = ALSpoly;  //geometry()
var ALSpolyBuffer = ALSpolygon.buffer({'distance': -25});

//clipfunction for the inner ALS buffer
var clipToALS = function(image){
  return image.clip(ALSpolyBuffer);
};

//clipfunction for the forest boundary
var clipToForest = function(image){
  return image.clip(ForestPoly);
};


////##################################################################################################

//                  ###  Get and filter the data ###


// Quality filter mask function for GEDI data  //Apply 3 filter: quality_flag, degrade_flag,and outlier max
var qufilter = function(im) {
  return im.updateMask(im.select('quality_flag').eq(1))
      .updateMask(im.select('degrade_flag').eq(0))
      .updateMask(im.select('rh90').gt(2))
  .updateMask(im.select('rh100').lt(90));
};

// GEDI data + Filter the shots with distance < 25m from the edge by clipping to inner buffer poly
var GEDIdata = ee.ImageCollection('LARSE/GEDI/GEDI02_A_002_MONTHLY')
                  .map(qufilter).map(clipToALS).map(clipToForest)
                  .max();

// Filter ALS data
var ALS = ALS.updateMask(ALS.select('b1').gt(2)).updateMask(ALS.select('b1').lt(90));

   
     
//select the GEDI chosen metrics for the stat
var GEDIrhStat = GEDIdata.select('rh'+ChosenMetric+'');
//##################################################################################################


//                  ###  Making a grid (fishnet) to aggregate the data into ###



// Geometry of the ALS inner buffer (area of interest)
var polygon = ALSpolyBuffer;

// Create a Feature from the Geometry.
var polyFeature = ee.Feature(polygon, {id : 1});

// Get projection of reference image (here we use GEDI projection)
var proj = GEDIdata.projection();



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


//GEDI circular footprint
   
     
//select GEDI  metric
var GEDIrh = ee.ImageCollection('LARSE/GEDI/GEDI02_A_002_MONTHLY').filterBounds(ALSpolyBuffer)
                  .map(qufilter).map(clipToALS).map(clipToForest).select('rh'+ChosenMetric+'');
                  
var mosaic = GEDIrh.mosaic().setDefaultProjection({crs: GEDIrh.first().projection(), scale: GEDIrh.first().projection().nominalScale()});

var points = mosaic.sample({region: polygon,scale: GEDIrh.first().projection().nominalScale(),projection: GEDIrh.first().projection(),geometries: true});

// make a buffer around the points
var buf = function(fc){return fc.buffer({'distance': 12.5});};
var FP = points.map(buf)


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
Map.addLayer(GEDIdata, {}, 'GEDI_raw gridded', false);  // GEDI gridded
Map.addLayer(FP, {}, 'GEDI footprint', false); // GEDI footprint
Map.addLayer(ALS, Vis, 'ALS', false); // ALS

// Add the grid
Map.addLayer(grid, {}, 'grid', false);



// Print the area and basic stat for GEDI and ALS, 'if you need to '
if (Printbasicstat == 'yes') {
  CalcArea(ALSpolygon,1);  // The Area in km
  CalcImStat(GEDIrhStat, ALSpolygon, 25);  // Mean, Max, Min GEDI
  CalcImStat(ALS, ALSpolygon, 1);  // Mean, Max, Min ALS
} else {}


//##################################################################################################


//                  ###  Aggregate the heights from ALS and GEDI to the grid in different methods###


//Aggregate the heights from the ALS to the grid using percentiles then mean and the scale of the actual als chm (1m here)


var ALSaggreg = function(ppp){
  if (ppp  == 'mean') {
      var Agg_ALS = ALS.reduceRegions({collection: grid,reducer: ee.Reducer.mean(),scale: 1,});
      // Reduce the Grddid ALS back to images and stack
      Agg_ALS = Agg_ALS.select('mean').reduceToImage(['mean'], ee.Reducer.first());
      // Rename the property of each image
      Agg_ALS = Agg_ALS.select(['first'],['ALSmean']);
} else {
      var Agg_ALS = ALS.reduceRegions({collection: grid,reducer: ee.Reducer.percentile([ppp], ['p'+ppp+'']),scale: 1,});
      // Reduce the Grddid ALS back to images and stack
      Agg_ALS = Agg_ALS.select('p'+ppp+'').reduceToImage(['p'+ppp+''], ee.Reducer.first());
      // Rename the property of each image
      Agg_ALS = Agg_ALS.select(['first'],['ALS'+ppp+'']);
     }
     return Agg_ALS};


// Aggregate ALS per grid cell using different methods
 var Agg_MeanALS = ALSaggreg('mean');
 var Agg_50ALS = ALSaggreg(50);
 var Agg_90ALS = ALSaggreg(90);
 var Agg_95ALS = ALSaggreg(95);
 var Agg_100ALS = ALSaggreg(100);


//Aggregate the GEDI heights to the grid using percentiles or mean and the scale of the actual GEDI cell (25m here)
if (GEDI_validation_method == 'FP'){
    var GEDIaggregation = function(metric){
  var GEDIm = GEDIdata.select('rh'+metric+'');
  GEDIm = GEDIm.reduceRegions({collection: GEDIgrid,reducer: ee.Reducer.mean().unweighted(),scale: 25,});
  // Reduce the Grddid GEDI back to images and stack
  GEDIm = GEDIm.select('mean').reduceToImage(['mean'], ee.Reducer.first());
  // Rename the property of each image
  GEDIm = GEDIm.select(['first'],['GEDI'+metric+'']);
  return GEDIm};
} else if (GEDIAggregationMethod  == 'M') {
  var GEDIaggregation = function(metric){
  var GEDIm = GEDIdata.select('rh'+metric+'');
  GEDIm = GEDIm.reduceRegions({collection: GEDIgrid,reducer: ee.Reducer.mean().unweighted(),scale: 25,});
  // Reduce the Grddid GEDI back to images and stack
  GEDIm = GEDIm.select('mean').reduceToImage(['mean'], ee.Reducer.first());
  // Rename the property of each image
  GEDIm = GEDIm.select(['first'],['GEDI'+metric+'']);
  return GEDIm};
} else {
  var GEDIaggregation = function(metric){
  var GEDIm = GEDIdata.select('rh'+metric+'');
  GEDIm = GEDIm.reduceRegions({collection: GEDIgrid,reducer: ee.Reducer.percentile([GEDIpercentile], ['p'+GEDIpercentile+'']).unweighted(),scale: 25,});
  // Reduce the Grddid GEDI back to images and stack
  GEDIm = GEDIm.select('p'+GEDIpercentile+'').reduceToImage(['p'+GEDIpercentile+''], ee.Reducer.first());
  // Rename the property of each image
  GEDIm = GEDIm.select(['first'],['GEDI'+metric+'']);
  return GEDIm};}

// Aggregate GEDI per cell for each metric of interest
var Agg_50GEDI = GEDIaggregation(50);
var Agg_75GEDI = GEDIaggregation(75);
var Agg_90GEDI = GEDIaggregation(90);
var Agg_95GEDI = GEDIaggregation(95);
var Agg_100GEDI = GEDIaggregation(100);

// Mask to avoid missing values and add bands from one to another 
var Msked_MeanALS = Agg_MeanALS.mask(Agg_50GEDI);
var Msked_50ALS = Agg_50ALS.mask(Agg_50GEDI);
var Msked_90ALS = Agg_90ALS.mask(Agg_50GEDI);
var Msked_95ALS = Agg_95ALS.mask(Agg_50GEDI);
var Msked_100ALS = Agg_100ALS.mask(Agg_50GEDI);

var CorAll = Msked_MeanALS.addBands(Msked_50ALS).addBands(Msked_90ALS).addBands(Msked_95ALS).addBands(Msked_100ALS)
                         .addBands(Agg_50GEDI).addBands(Agg_75GEDI).addBands(Agg_90GEDI).addBands(Agg_95GEDI).addBands(Agg_100GEDI);

var CorAll = CorAll.updateMask(CorAll.select('ALSmean').gt(0));

// Add the aggregated grid to the map
Map.addLayer(CorAll, {min: 1,max: 70}, 'Aggregated ALS & GEDI', false);

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

 // number of cell in the grid
  var Ncell = ee.Number(Agg_100ALS.reduceRegion({geometry: polygon,reducer: 'count',scale: Cellsampling,}).get('ALS100'));
  print('N. of '+Cellsampling+'m2 cells in the grid:', Ncell);

 // Sample size
 var Ssize = CorAll.select(['GEDI100']);
 
 var SsizeFP = ee.Number(Ssize.reduceRegion({geometry: polygon,reducer: 'count',scale: 25,}).get('GEDI100'));
 var SsizeGC = ee.Number(Ssize.reduceRegion({geometry: polygon,reducer: 'count',scale: Cellsampling,}).get('GEDI100'));

//if method FP the scale is 25, otherwise it's Cellsampling
 if (GEDI_validation_method == 'FP') {
    print('Gridded sample size(To GEDI footprint):', SsizeFP);
  } else {
    print('Gridded sample size(To Gridded Cells):', SsizeGC);
 
  } 
    // Number of GEDI shots per grid cell in the etire region
   var FCshotsPerCell = GEDIrhStat.reduceRegions({collection: grid,reducer: ee.Reducer.count(),scale: 25,});
   var NshotsPerCell = ee.Number(FCshotsPerCell.reduceColumns(ee.Reducer.mean(), ['count']).get('mean'));
   print('Average N. of shots per'+Cellsampling+'m cell (In the whole region):', NshotsPerCell);
  
   // Number of GEDI shots per grid cell when there is coverage only
   var filterNshotsPerCell = FCshotsPerCell.filter(ee.Filter.gt('count', 0));
   // get the stats (mean, max, min) of the shot coverage 
    print('Stat of the N. of shots Coverage per'+Cellsampling+'m cell (In the sampled cells):');
    CalcFcStat(filterNshotsPerCell, 'count');

} else {}

//##################################################################################################

//                            ###  Chart the heights in Boxplots ####

// Boxplot function to plot image bands
function boxPlotChart(image, xLabels, percentiles) {
  var reducer2 = ee.Reducer.mean().setOutputs(['main']).combine({ reducer2: ee.Reducer.percentile(percentiles), sharedInputs: true });
  var data = image.reduceRegion({ reducer: reducer2, geometry: ALS.geometry(), scale: Cellsampling,
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
          intervals: {
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
var bandsName = CorAll.bandNames();
var boxplotC = boxPlotChart(CorAll, bandsName, percentiles);

// Print the area and basic stat for GEDI and ALS, 'if you need to '
if (Printboxplot == 'yes') {
  print(boxplotC);
} else {}


//##################################################################################################


      //                                ###  Correlation ###
//                  ###  Extract values, Chart and check correlation ###

// Extracting pixel values
if (GEDI_validation_method == 'FP') {
  var pixelVals = CorAll.reduceRegion(
    {reducer: ee.Reducer.toList(), geometry: polyFeature.geometry(), scale: 25});
} else {
  var pixelVals = CorAll.reduceRegion(
    {reducer: ee.Reducer.toList(), geometry: polyFeature.geometry(), scale: Cellsampling});
}

// print the dictionary object to the console to check observations
if (PrintPixelVals == 'yes') {
  print('pixel values Object:', pixelVals);
} else {}

// Prepare values to be plotted along x axe
var x = ee.List(pixelVals.get(ALSagg));


// function to chart values along y axe as a function of GEDI metric

var correlationChart = function(GEDImet){

// Get values from dictionary and make lists
var y = ee.List(pixelVals.get(GEDImet));

// Define the chart and set options
var chartCorrle = ui.Chart.array.values({array: y, axis: 0, xLabels: x}).setOptions({
  title: 'Correlation '+GEDImet+' & '+ALSagg+'  aggregated to '+Cellsampling+'m pixel',
  colors: [Chcolor],//'green', 'orange', '2ECCFA', '2d4051', '999900'
  hAxis: {
    title: 'ALS ',
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


//Check linear fit as a function of GEDI metric
var linearfitf = function(GEDImet){

// get values from dictionary and make lists
var y = ee.List(pixelVals.get(GEDImet));

var linearfit = ee.Array.cat([x, y], 1).reduce(ee.Reducer.linearFit(),[0],1);
return linearfit;};

// sample the stack from the image
var sample = CorAll.sample({'region':polyFeature.geometry(), 
                            'scale': 25});
var correl = ee.Reducer.pearsonsCorrelation();
// Get Correlation values
var CorrelationV = function(GEDImet){
// Set the correlation properties
var CorrelV = sample.reduceColumns(correl, [GEDImet, ALSagg]);



return CorrelV;};

//note: printing the results nested in error function



//##################################################################################################


//                  ###  Calculate RMSE, rRMSE, and delta ###

// transfer the values to arrays
var N = ee.Array(x);

// get the values as a function for GEDI metric
var error = function(GEDImet){
var y = ee.List(pixelVals.get(GEDImet));
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
var cor = CorrelationV(GEDImet);
var correV = ee.Number(cor.get('correlation'));
var pVal = ee.Number(cor.get('p-value'));

var ved = [correV, pVal, RMSE, rRMSE, d];
return ved;
};



//##################################################################################################

var testCor = function(GEDImet){


//Conditional printing for Linearfit
if (PrintCorCharts == 'yes') {
  print(correlationChart(GEDImet));
} else {}

//Conditional printing for Linearfit
if (PrintLinearFit == 'yes') {
  print('Linear fit:', linearfitf(GEDImet));
} else {}


//Conditional printing for Correlation values
if (PrintCorVals == 'yes') {
  print('Correlation Values:',  CorrelationV(GEDImet));
} else {}


//Printing the results
print('CorreV, pVal, RMSE, rRMSE, d:', error(GEDImet));
};


testCor('GEDI50')
testCor('GEDI75')
testCor('GEDI90')
testCor('GEDI95')
testCor('GEDI100')

//Chart
var ttestCor = function(GEDImet){
  print(correlationChart(GEDImet));
};

if (ChartAttheEnd == 'yes') {
ttestCor('GEDI50')
ttestCor('GEDI75')
ttestCor('GEDI90')
ttestCor('GEDI95')
ttestCor('GEDI100')
} else {}





//##################################################################################################


//                  ### Chart the heights in Histogram ###
var select = CorAll.select([ALSagg, 'GEDI'+ChosenMetric+'']);
var bandsName = select.bandNames();

// Define the chart and print it to the console.
var Histo =
    ui.Chart.image.histogram({image: select, region: ALS.geometry(), scale: Cellsampling})
        .setSeriesNames(bandsName)
        .setOptions({
          title: 'GEDI Vs ALS Histogram',
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

//##################################################################################################

 /*                    //deleted part//
//                              ### Get statistics of the heights ###

var Hstat = function(band) {

  var image = CorAll.select([band]);
  
  var combinedReducer = ee.Reducer.mean()
    .combine({reducer2: ee.Reducer.median(), sharedInputs: true})
    .combine({reducer2: ee.Reducer.mode(),sharedInputs: true})
    .combine({reducer2: ee.Reducer.variance(),sharedInputs: true})
    .combine({reducer2: ee.Reducer.min(),sharedInputs: true})
    .combine({reducer2: ee.Reducer.max(),sharedInputs: true})
    .combine({reducer2: ee.Reducer.kurtosis(),sharedInputs: true})
    .combine({reducer2: ee.Reducer.stdDev(),sharedInputs: true})
    .combine({reducer2: ee.Reducer.kendallsCorrelation(),sharedInputs: true})
    .combine({reducer2: ee.Reducer.skew(),sharedInputs: true});
    
  
  var stats = image.reduceRegion({
    reducer: combinedReducer,
    geometry: ALS.geometry(),
    scale: Cellsampling
  });
  
  var meanKey = ee.String(band).cat('_mean')
  var medianKey = ee.String(band).cat('_median')
  var modeKey = ee.String(band).cat('_mode')
  var varianceKey= ee.String(band).cat('_variance')
  var minKey=ee.String(band).cat('_min')
  var maxKey=ee.String(band).cat('_max')
  var kurtosisKey=ee.String(band).cat('_kurtosis')
  var skewKey=ee.String(band).cat('_skew')
   
  
  var properties = {
    'band': band,
    'mean': stats.get(meanKey),
    'median': stats.get(medianKey),
    'mode': stats.get(modeKey),
    'variance': stats.get(varianceKey),
    'minimum': stats.get(minKey),
    'maximum': stats.get(maxKey),
    'kurtosis': stats.get(kurtosisKey),
    'skew': stats.get(skewKey)
  }

  return ee.Feature(null, properties)
};
var HeightStat = Hstat('ALS100')

//print(HeightStat, 'HeightStat')
/*/
//##################################################################################################
