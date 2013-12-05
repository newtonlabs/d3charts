if (d3.charts === null || typeof(d3.charts) !== 'object') { d3.charts = {}; }

this.d3.charts.tablechart = function() {
  'use strict';


  // custom config and overides
  var chart  = d3.charts.baseChart()
      .config('svgArea', false)
      .config('chartArea', false)
      .config('graphicArea', false)
      .config('legend', false)
      .config('leftLabels', true)
      .config('bottomLabels', true)
      .config('topLabels', true)
      .config('titleOn', true)
      .config('chartType', 'line')
      .config('className', 'tablechart')
      .builder(d3.charts.tablechartBuilder);

  return chart;
};
