"use strict";

var timeseriesChart = d3.charts.timeseries();

var parseDate = d3.time.format("%Y%m%d").parse;

d3.tsv("constants/data.tsv", function(error, data) {
  var series = d3.keys(data[0]).filter(function(key) { return key !== "date"; })

  data.forEach(function(d) {
    d.date = parseDate(d.date)
  })

  var scrubbed = _.map(series, function(name) {
    return {
      series: name,
      data: _.map(data, function(d) {
        return {date: d.date, value: +d[name]};
      })
    };
  });

 d3.select("#timeseries").datum(scrubbed).call(timeseriesChart);
});


var heatmapChart = d3.charts.heatmap();
d3.csv("constants/heatmap_data.csv", function(error, data) {
  console.log(data);
   d3.select("#heatmap").datum(data).call(heatmapChart);
});

