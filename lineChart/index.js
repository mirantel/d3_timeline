// Graph Data
// var rubyData = <%= data.to_json.html_safe %>;

function createChart(divID, rubyData) {
  // Find element and append SVG
  var chartWrapper = document.getElementById(divID);
  var chart = d3.select(chartWrapper).append("svg");
  var wrapperWidth = chartWrapper.clientWidth;
  var wrapperHeight = chartWrapper.clientHeight;

  chart
    .attr("width", wrapperWidth)
    .attr("height", wrapperHeight);

  // Set the dimensions of the canvas / graph
  var margin = {top: 20, right: 20, bottom: 110, left: 40},
      margin2 = {top: (wrapperHeight-75), right: 20, bottom: 30, left: 40},
      width = +chart.attr("width") - margin.left - margin.right,
      height = +chart.attr("height") - margin.top - margin.bottom,
      height2 = +chart.attr("height") - margin2.top - margin2.bottom;

  // Parse the date / time
  var parseDate = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ");

  var data = [];
  rubyData.forEach(function(item, index) {
    return data.push({
      date: parseDate(item.date),
      score: item.score,
      createdBy: item.created_by
    })
  });

  // Set the ranges
  var x = d3.scaleTime().range([0, width]),
      x2 = d3.scaleTime().range([0, width]),
      y = d3.scaleLinear().range([height, 0]),
      y2 = d3.scaleLinear().range([height2, 0]);

  // Define the axes
  var xAxis = d3.axisBottom(x)
        .tickSize(-height),
      xAxis2 = d3.axisBottom(x2),
      yAxis = d3.axisLeft(y)
        .tickSize(-width)
        .tickArguments(10)
        .tickFormat(function(d) { return d + "%"; });

  // Define the brush
  var brush = d3.brushX()
      .extent([[0, 0], [width, height2]])
      .on("brush end", brushed);

  // Define the zoom
  var zoom = d3.zoom()
      .scaleExtent([1, Infinity])
      .translateExtent([[0, 0], [width, height]])
      .extent([[0, 0], [width, height]])
      .on("zoom", zoomed);

  var area = d3.area()
      .curve(d3.curveLinear)
      .x(function(d) { return x(d.date); })
      .y0(height)
      .y1(function(d) { return y(d.score); });

  var area2 = d3.area()
      .curve(d3.curveLinear)
      .x(function(d) { return x2(d.date); })
      .y0(height2)
      .y1(function(d) { return y2(d.score); });

  var tip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-8, 0])
    .html(function(d) {
       return "<b>Scrore: </b>" + d.score + "%<br>" +
              "<b>Date: </b>" + d.date + "<br>" +
              "<b>Scored by: </b>" + d.createdBy;
     });
  chart.call(tip);

  chart.append("defs").append("clipPath")
      .attr("id", "clip")
    .append("rect")
      .attr("width", width)
      .attr("height", height + 10) // 10 - for dots
      .attr("transform", "translate( 0, -5 )"); // -5  - for dots

  var focus = chart.append("g")
      .attr("class", "focus")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var context = chart.append("g")
      .attr("class", "context")
      .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

    // Scale the range of the data
    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain([0, 100]);
    x2.domain(x.domain());
    y2.domain(y.domain());

    // Add focus (top) path
    focus.append("path")
        .datum(data)
        .attr("class", "area")
        .attr("d", area);

    focus.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    focus.append("g")
        .attr("class", "axis axis--y")
        .call(yAxis);

    focus.append("rect")
        .attr("class", "zoom")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(zoom);

    // Add the scatterplot
    focus.append("g")
        .attr('class', 'dots')
        .selectAll("dot")
        .data(data)
      .enter().append("circle")
        .attr("r", 3)
        .attr('class', 'dot')
        .attr("cx", function(d) { return x(d.date); })
        .attr("cy", function(d) { return y(d.score); })
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide);

    context.append("path")
        .datum(data)
        .attr("class", "area")
        .attr("d", area2);

    context.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height2 + ")")
        .call(xAxis2);

    context.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.move, x.range());

  function brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
    var s = d3.event.selection || x2.range();
    x.domain(s.map(x2.invert, x2));
    focus.select(".area").attr("d", area);
    focus.select(".axis--x").call(xAxis);
    focus.selectAll(".dot").attr("cx", function(d) { return x(d.date); });
    chart.select(".zoom").call(zoom.transform, d3.zoomIdentity
        .scale(width / (s[1] - s[0]))
        .translate(-s[0], 0));
  }

  function zoomed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
    var t = d3.event.transform;
    x.domain(t.rescaleX(x2).domain());
    focus.select(".area").attr("d", area);
    focus.select(".axis--x").call(xAxis);
    focus.selectAll(".dot").attr("cx", function(d) { return x(d.date); });
    context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
  }
}

createChart('chart', myRubyData);
createChart('chart2', myRubyData2);
