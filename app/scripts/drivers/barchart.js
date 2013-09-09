var barChart = d3.charts.barchart();
d3.csv("data/barchart_data.csv", function(error, data) {

  var uniqueProperties = function(data, property) {
    return _.reduce(data, function(memo, d) {
      if (! _.find(memo, function(o) {return d[property].trim() === o;})) {
        memo.push(d[property]);
      }
      return memo;
    },[]);
  };

  var categoryValue = function(data, category, xAxis) {
    data = _.filter(data, {category: category, xAxis: xAxis});
    return _.reduce(data, function(memo, num){ return memo + Number(num.value); }, 0);
  }

  data = _.filter(data, function(d){ return ((d.yAxis == 'Net Promoter Score') && (d.category == 'January')); });

  var scrubbed = [],
  rows = d3.utilities.uniqueProperties(data, 'xAxis'),
  categories = d3.utilities.uniqueProperties(data, 'category');

  rows.forEach(function(r) {
    var obj = {
      xAxis: r,
      yAxis: data[0].yAxis,
      target: data[0].target
    }
    categories.forEach(function(c) {
      obj[c] = categoryValue(data, c, r);
    });
    scrubbed.push(obj);
  }); 
  
  d3.select("#barchart").datum(scrubbed).call(barChart);
  // console.log(barChart.svg());
});
