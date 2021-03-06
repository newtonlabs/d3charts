
window.canvas.tree = function() {
  var data = canvas.data;
  var nodeHeight = 90;
  var nodeWidth = 180;
  var nodeCurve = 3;
  var nodeSpace = 250;
  var truncAmount = 25;
  var nodeColor = '#ffffff';
  var nodeColorSelected = 'lightyellow';
  var deltaX = 90;
  var deltaY = 40;
  var margin = {top: 0, right: 0, bottom: 0, left: 70},
      width = 1000,
      height = 250,
      i = 0,
      duration = 450,
      root;

  var leafColor = d3.scale.ordinal().domain(_.range(4)).range(['#85d3e5', '#85d3e5', '#1d4e97', '#1d4e97', '#2f347d']);
  var round = function(num) {return Math.round(num * 100) / 100 }
  var changed = function(d) {return round(d.previous_quarter_response_delta * 100); }
  var current = function(d) {return round(d.response * 100); }
  var changeColor = function(d) {return (d.change > 0) ? 'green' : 'red'}
  var isLeaf = function(d) {return d.depth === 3};
  var strokeWidth = function(d) {return isLeaf(d.target) ? 2.5 : 2.5; }
  var strokeColor = function(d) {return isLeaf(d.target) ? leafColor(d.target.importance) : "#252626"; }
  var borderColor = function(d) {return isLeaf(d) ? leafColor(d.importance) : "#252626"; }
  var responseTotal = function(d) {return _.map(_.range(6), function(o) { return d["response_total_"+ (o+1)]}); }
  var changeResponseTotal = function(d) {return _.map(_.range(6), function(o) { return d["change_response_total_"+ (o+1)]}); }

  String.prototype.trunc = String.prototype.trunc ||
    function(n){return this.length>n ? this.substr(0,n-1)+'...' : this; };

  var greatGrandChildren = function(parent) {
    return _.map(_.where(data, function(d) {
      return d.type == parent.type && d.quality_aspect == parent.quality_aspect && d.question !== 'Overall'
    }), function(d) {
      return {
        type: d.type,
        name: d.question,
        response: current(d),
        responseTotal: responseTotal(d),
        changeResponseTotal: changeResponseTotal(d),
        change: changed(d),
        importance: d.importance
      }
  })};

  var grandChildren = function(parent) {
    return _.map(_.where(data, function(d) {
      return d.type == parent.type && d.question === 'Overall'
    }), function(d) {
      return {
        name: d.quality_aspect,
        response: current(d),
        responseTotal: responseTotal(d),
        changeResponseTotal: changeResponseTotal(d),
        change: changed(d),
        children: greatGrandChildren(d)
      }
  })};

  var children = function() {
    return _.map(_.where(data, function(d) {
      return d.quality_aspect === 'Metro' || d.quality_aspect === 'NGPT'
    }), function(d) {
      return {
        name: d.quality_aspect,
        response: current(d),
        responseTotal: responseTotal(d),
        changeResponseTotal: changeResponseTotal(d),
        change: changed(d),
        children: grandChildren(d)
      }
  })};

  var treeData = {
    name: 'Overall',
    response: '85',
    change: '5',
    children: children()
  }

  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }

  var draw = function() {
    root = treeData;
    root.x0 = height / 2;
    root.y0 = 0;
    root.children.forEach(collapse);
    update(root);
  }

  var getSiblings = function(d) {
    return _.where(tree.nodes(root), function(node) { return node.depth === d.depth && node.name !== d.name });
  }

  var collapseSiblings = function (d) {
    _.each(getSiblings(d),
      function(node) {
        collapse(node);
      }
    )
  }

  function click(d) {
    collapseSiblings(d);
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    if (isLeaf(d)) {
      window.canvas.detailChart(d);
      makeActive($('.toptab')[0]);
      $('.toptab:first').tab('show');
      $('#detailChart').modal('show');
      $('#parent').html(d.parent.name);
      $('#leaf').html(d.name);
    }
    else {
      update(d);
    }
  }

  var longestBranch = function() {
    return _.reduce(tree.nodes(root), function(memo, node) {
      var children = node.children || [];
      memo = memo < children.length ? children.length : memo;
      return memo;
    }, 0);
  }

  function update(source) {
    var newHeight = Math.max(250, longestBranch() * nodeHeight * 1.4 + margin.top + margin.bottom);

    d3.select("svg").transition()
        .duration(duration)
        .attr("height", newHeight);

    // Compute the new tree layout.
    tree = d3.layout.tree().size([newHeight, width]);

    var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach(function(d) {
      d.y = d.depth * nodeSpace;
    });

    // Update the nodes…
    var node = svg.selectAll("g.node")
        .data(nodes, function(d) { return d.id || (d.id = ++i); });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + (source.y0) + "," + (source.x0 - nodeHeight/2) + ")"; })
        .on("click", click);

    nodeEnter.append("rect")
        .attr('height', nodeHeight)
        .attr('width', nodeWidth)
        .attr('rx', nodeCurve)
        .attr('ry', nodeCurve)
        .attr('stroke-width', "2.5")
        .style("fill", color);

    nodeEnter.append("text")
        .attr("x", function(d) { return d.children || d._children ? 10 : 10; })
        .attr("y", function(d) { return 18 })
        .attr("dy", ".35em")
        .attr("text-anchor", function(d) { return d.children || d._children ? "start" : "start"; })
        .text(function(d) { return d.name.trunc(truncAmount); })
        .style("fill-opacity", 1e-6);

    nodeEnter.append("text")
        .attr("x", function(d) { return d.children || d._children ? 10 : 10; })
        .attr("y", function(d) { return 31 })
        .attr("dy", "1.2em")
        .attr("class", "response")
        .attr("text-anchor", function(d) { return d.children || d._children ? "start" : "start"; })
        .text(function(d) { return d.response + '%'; });

    var deltaBlock = nodeEnter.append("g")
        .attr("class","delta")
        .attr("transform", function(d) { return "translate(" + deltaX + "," + deltaY + ")"})

    deltaBlock.append("rect")
      .attr("height", 40)
      .attr("width", 80)
      .attr("x", 0)
      .attr("y", 0)
      .attr('stroke-width', "2.5")
      .style("fill", changeColor)

    var deltaDescription = deltaBlock.append("g")
        .attr("transform", function(d) { return "translate(" + 5 + "," + 0 + ")"})

    deltaDescription.append("line")
        .attr('stroke', changeColor)
        .attr("x1", 6)
        .attr("x2", 6)
        .attr("y1", function(d) { return d.change >= 0 ? 25 : 14})
        .attr("y2", function(d) { return d.change >= 0 ? 24 : 15})
        .attr("stroke-width", 3)
        .attr("marker-end", "url(#triangle)")

    deltaDescription.append("text")
        .attr("x", 9)
        .attr("y", 4)
        .attr("dy", "1em")
        .attr("dx", ".3em")
        .attr("class", "delta")
        .attr("text-anchor", function(d) { return d.children || d._children ? "start" : "start"; })
        .text(function(d) { return d.change + '%'; });

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) {
          return "translate(" + (d.y - 70 ) + "," + (d.x - nodeHeight/2) + ")";
        });

    var color = function(d) {
      if (isLeaf(d)) {
        return nodeColor;
      }
      if (d._children == null) {
        return nodeColorSelected;
      }
      return nodeColor;
    }

    nodeUpdate.select("rect")
        .attr('height', nodeHeight)
        .attr('width', nodeWidth)
        .attr('rx', nodeCurve)
        .attr('ry', nodeCurve)
        .style("fill", color)
        .attr('stroke-width', "2.5")
        .attr("stroke", borderColor);

    nodeUpdate.select("text")
        .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + source.y + "," + (source.x  - nodeHeight/2)+ ")"; })
        .remove();

    nodeExit.select("rect")
        .attr('rx', nodeCurve)
        .attr('ry', nodeCurve)
        .attr('height', nodeHeight)
        .attr('width', nodeWidth)

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    // Update the links…
    var link = svg.selectAll("path.link")
        .data(links, function(d) { return d.target.id; });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("stroke", strokeColor )
        .attr("stroke-width", strokeWidth)
        .attr("d", function(d) {
          var o = {x: source.x0, y: source.y0};
          return diagonal({source: o, target: o});
        });

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", function(d) {
          return lineLink([{x: d.source.y, y: d.source.x },{x: d.target.y, y: d.target.x }])
        });

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
          return lineLink([{x: d.source.y, y: d.source.x },{x: d.source.y, y: d.source.x }])
        })
        .remove();

    // Stash the old positions for transition.
    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  var tree = d3.layout.tree()

  var diagonal = d3.svg.diagonal()
      .projection(function(d) { return [d.y, d.x]; });

  var lineLink = d3.svg.line().interpolate("step")
     .x(function(d) { return d.x; })
     .y(function(d) { return d.y; });

  var svg = d3.select("#tree").append("svg")
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var triangle = svg.append("marker")
      .attr("id", "triangle")
      .attr('viewBox','0 0 10 10')
      .attr('refX', '0')
      .attr('refY', '5')
      .attr('markerUnits', 'strokeWidth')
      .attr('markerWidth', '3')
      .attr('markerHeight', '3')
      .attr('fill', 'white')
      .attr('orient', 'auto')

  triangle.append('path').attr('d','M 0 0 L 10 5 L 0 10 z')

  draw();
}

window.canvas.tree();
