// note: map points are formatted as [longitude,latitude]

// create slider
$(function(){
   var handle = $("#custom-handle")
   $("#slider").slider({
      min: 1900,
      max: 2018,
      create: function() {
         handle.text($(this).slider("value"))
      },
      slide: function(event, ui) {
         handle.text(ui.value)
      }
   })
   $("#btnDraw").click(function(){
      drawEarthquakes($("#slider").slider("value"))
   })
})
// global variables
var svgWidth  = 960
var svgHeight = 500
var padding   = 20
var state, earthquakes, wells, point, magnitude, startYear, filteredEarthquakes

// formatter for date objects
var formatDate = d3.timeFormat("%Y")

// color scale for earthquakes
var color = d3.scaleLinear()
.domain([3, 6])
.range(["yellow", "red"])

// create SVG element
var svg = d3.select("#chart")
.append("svg")
.attr("width", svgWidth)
.attr("height", svgHeight)
.attr("fill","white")

// preload data to prevent drawing before data is finished loading
d3.queue()
.defer(d3.json, 'data/ok.json')
.defer(d3.csv,  'data/ok_earthquakes.csv')
.defer(d3.csv,  'data/injection_wells.csv')
.await(dataLoaded)

function dataLoaded(error, a, b, c) {
   state       = a
   earthquakes = b
   wells       = c

   // convert origin time from datetime to year using formatDate()
   // we only need the year for filtering
   earthquakes = earthquakes.map(function(d){
      d.origintime = formatDate(new Date(d.origintime))
      return d
   })

   // filter earthquakes with magnitude >= 3
   // this is the threshold in which earthquakes are felt
   // see https://earthquake.usgs.gov/learn/topics/mag_vs_int.php
   earthquakes = earthquakes.filter(function(d){
      return +d.prefmag >= 3
   })

   // calculate boundaries (for later use)
   var bounds = state.bbox
   var longitudeLeft  = bounds[0]
   var latitudeBottom = bounds[1]
   var longitudeRight = bounds[2]
   var latitudeTop    = bounds[3]

   // define projection
   projection = d3.geoMercator()
   .fitSize([svgWidth,svgHeight],state)

   // define path generator
   var path = d3.geoPath()
   .projection(projection)

   // draw state (bind data and create one path per GeoJSON feature)
   svg.selectAll("path")
   .data(state.features)
   .enter()
   .append("path")
   .attr("d", path)
   .attr("stroke","black")
} // end dataLoaded()

function drawEarthquakes(startYear) {
   // filter earthquakes by selected year
   filteredEarthquakes = earthquakes.filter(function(d){
      return +d.origintime >= startYear
   })

   // remove existing earthquakes
   svg.selectAll("circle").remove()

   var earthquakeCircles = svg.selectAll("earthquake")
   .data(filteredEarthquakes)
   .enter()
   .append("circle")
   .attr("cx", function(d){
      return projection([+d.longitude,+d.latitude])[0]
   })
   .attr("cy", function(d){
      return projection([+d.longitude,+d.latitude])[1]
   })
   .attr("r", function(d){
      // scale magnitudes exponentially to provide
      // noticeable differentiation
      return Math.pow(+d.prefmag,2.2)
   })
   .attr("stroke", "gray")
   .attr("fill", function(d){
      return color(+d.prefmag)
   })

   // draw wells
   var wellCircles = svg.selectAll("well")
   .data(wells)
   .enter()
   .append("circle")
   .attr("cx", function(d) {
      // preceding + converts string to int
      point = [+d.LONG,+d.LAT]
      return projection(point)[0]
   })
   .attr("cy", function(d) {
      // preceding + converts string to int
      point = [+d.LONG,+d.LAT]
      return projection(point)[1]
   })
   .attr("r", "1px")
   .attr("fill", "green")
} // end drawEarthquakes()
