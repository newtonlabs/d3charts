/*jslint browser: true*/
/*global $, jQuery, d3, _*/

if (d3.charts === null || typeof(d3.charts) !== "object") { d3.charts = {}; }

// Based on http://bost.ocks.org/mike/chart/
this.d3.charts.barchart = function() {
 'use strict';

  var width = 1500,
    height = 500,
    svg = {},
    margin = { top: 20, right: 100, bottom: 10, left: 250 },
    color = d3.scale.category20();

  function my(selection) {

    var chartWidth    = width  - margin.left - margin.right,
        chartHeight   = height - margin.top  - margin.bottom;

    var x0 = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1);

    var x1 = d3.scale.ordinal();

    var y = d3.scale.linear()
        .range([chartHeight, 0]);

    var xAxis = d3.svg.axis()
        .scale(x0)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickFormat(d3.format(".2s"));

    svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    selection.each(function(data) {
      var groups = d3.keys(data[0]).filter(function(key) { return ((key !== "xAxis") && (key !== "yAxis") && (key !== "target")); });

      data.forEach(function(d) {
        d.group = groups.map(function(name) { return {name: name, value: +d[name]}; });
      });

      x0.domain(data.map(function(d) { return d.xAxis; }));
      x1.domain(groups).rangeRoundBands([0, x0.rangeBand()]);

      var d3Min =    d3.min(data, function (d) {
          return d3.min(d.group, function (d) {
              return d.value;
          });
      });
      if (d3Min > 0)
        d3Min = 0;

      var d3Max =  d3.max(data, function (d) {
           return d3.max(d.group, function (d) {
               return d.value;
           });
      });
      var target = Number(data[0].target);

      if (d3Max < target)
        d3Max = target;

      y.domain([ d3Min,d3Max ]);


      var xAxisTransform =  chartHeight;
      if(d3Min < 0 && 0 < d3Max) {
          xAxisTransform = chartHeight * (d3Max / (d3Max - d3Min));
      }

      var cat = svg.selectAll(".cat")
          .data(data)
        .enter().append("g")
          .attr("class", "g")
          .attr("transform", function(d) { return "translate(" + x0(d.xAxis) + ",0)"; });

      cat.selectAll("rect")
          .data(function(d) { return d.group; })
        .enter().append("rect")
          .attr("width", x1.rangeBand())
          .attr("x", function(d) { return x1(d.name); })
            .attr("y", function (d) {
                if(d.value < 0)
                    return y(0);
                return y(d.value);
            })
            .attr("height", function (d) {
                if(d.value < 0) {
                    return y(d.value+d3Max);
                }
                return chartHeight - y(d.value+d3Min);
            })
          .style("fill", function(d) { return color(d.name); });

      svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(0," + xAxisTransform + ")") // this line moves x-axis
            .call(xAxis);

      svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("y", -20)
            .attr("dy", ".71em")
            .style("text-anchor", "start")
            .text(data[0].yAxis);

      var line = svg.append("line")
                  .attr("x1", 0)
                  .attr("y1", y(target))
                  .attr("x2", width)
                  .attr("y2", y(target))
                  .attr("style", function(d) {return "fill:none;stroke-dasharray:5,5;stroke:gray;stroke-width:2;";});

      // var legend = svg.selectAll(".legend")
          // .data(groups.slice().reverse())
        // .enter().append("g")
          // .attr("class", "legend")
          // .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

      // legend.append("rect")
          // .attr("x", width - 18)
          // .attr("width", 18)
          // .attr("height", 18)
          // .style("fill", color);

      // legend.append("text")
          // .attr("x", width - 24)
          // .attr("y", 9)
          // .attr("dy", ".35em")
          // .style("text-anchor", "end")
          // .text(function(d) { return d; });
    });

  }

  // Getters and Setters
  my.width = function(value) {
    if (!arguments.length) { return width; }
    width = value;
    return my;
  };

  my.height = function(value) {
    if (!arguments.length) { return height; }
    height = value;
    return my;
  };

  my.svg = function() {
    return svg;
  };

  return my;
};