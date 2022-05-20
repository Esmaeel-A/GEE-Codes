//change tilescale if you like
var setTileScale = 16
 //#################################################################################### 
// roi "change roi size or add new one if you like"
var roi = ee.Geometry.Rectangle({coords: [-109.5, 40.0, -100.2, 43.9], geodesic: false});
Map.centerObject(roi, 5)
Map.addLayer(roi, {}, 'region')
 //#################################################################################### 
//  random points for traning data
var Nofpoints = roi.area(ee.ErrorMargin(10)).divide(1000000).int().multiply(15).aside(print)
var randomPoints = ee.FeatureCollection.randomPoints({region: roi, points: Nofpoints, seed: 0, maxError: 1});
var TVdata = (ee.FeatureCollection.randomPoints({region: roi, points: Nofpoints, seed: 0, maxError: 1})).randomColumn('Yvalue', 9);
var TVdata = TVdata.randomColumn('TorV');
// separate to training and validation points
var Tdata = TVdata.filter(ee.Filter.lt('TorV', 0.75));
var Vdata = TVdata.filter(ee.Filter.gte('TorV', 0.75));
 //#################################################################################### 
//get some landsat bands to model
var imageL8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2').filterBounds(roi)
                     .filterDate('2019-01-01', '2020-12-31')
                     .median().clip(roi).select(['SR_B2', 'SR_B3','SR_B4','SR_B5','SR_B6','SR_B7'])
//####################################################################################
var training = imageL8.sampleRegions({
  collection: Tdata,properties: ['Yvalue'],scale: 30,tileScale: setTileScale});

var regr = ee.Classifier.smileRandomForest(100, null, 1, 0.5, null, 1)
  .setOutputMode('REGRESSION').train({
    features: training,
    classProperty: 'Yvalue',
    inputProperties: (imageL8.bandNames()) });

var predicted = imageL8.classify(regr, 'Ypredicted');

var Vimp = ee.Feature(null, ee.Dictionary(regr.explain()).get('importance'));

var Yvalues = (predicted.sampleRegions({collection:Vdata, scale: 30, geometries: true})).select(['Yvalue', 'Ypredicted']);


var accuracyC = ui.Chart.feature.byFeature(Yvalues, 'Ypredicted', 'Yvalue')
.setChartType('ScatterChart').setOptions({
hAxis: {'title': 'Ypredicted '},
vAxis: {'title': 'Yvalue'},
pointSize: 2,
trendlines: { 0: {showR2: true, visibleInLegend: true}}});
print(accuracyC);

//
Export.table.toDrive({
  collection:  Yvalues,
  description: 'Yvalues',
   folder: "RFregression ",  
  fileFormat: 'CSV'
});

