// Graph Data
// var sourceData = <%= data.to_json.html_safe %>;

function createChart(divID, sourceData, tooltipContent, showArea, yAxisValue, yAxisTicksNum, yAxisTickFormat) {
  // Find element and append SVG
  var chartWrapper = document.getElementById(divID);
  var chart = d3.select(chartWrapper).append("svg");
  var wrapperWidth = chartWrapper.clientWidth;
  var wrapperHeight = chartWrapper.clientHeight;

  chart
    .attr("width", wrapperWidth)
    .attr("height", wrapperHeight);

  // Define the div for the tooltip
  var tooltip = d3.select(chartWrapper).append("div")
      .attr("class", "d3-tooltip")
      .style("opacity", 0);

  // Set the dimensions of the canvas / graph
  var margin = {top: 20, right: 20, bottom: 110, left: 40},
      margin2 = {top: (wrapperHeight-75), right: 20, bottom: 30, left: 40},
      width = +chart.attr("width") - margin.left - margin.right,
      height = +chart.attr("height") - margin.top - margin.bottom,
      height2 = +chart.attr("height") - margin2.top - margin2.bottom;

  // Parse the date / time
  var parseDate = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ");

  var data = [];
  sourceData.forEach(function(item, index) {
    return data.push({
      date: parseDate(item.date),
      score: item.score,
      createdBy: item.created_by
    })
  });

  if (data.length == 1) {
    data.unshift({
      "date": new Date(data[0].date.getFullYear(), data[0].date.getMonth(), data[0].date.getDate()-1),
      "score": yAxisValue[0],
    })
  }

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
        .ticks(yAxisTicksNum)
        .tickFormat(function(d) { return d + yAxisTickFormat; });

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

  var line = d3.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.score); });

  var line2 = d3.line()
      .x(function(d) { return x2(d.date); })
      .y(function(d) { return y2(d.score); });

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
    y.domain(yAxisValue);
    x2.domain(x.domain());
    y2.domain(y.domain());

    // Add focus (top) path
    focus.append("path")
        .datum(data)
        .attr("class", showArea ? "area" : "aria--hidden")
        .attr("d", area);

    focus.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("class", "line")
        .attr("d", line);

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
        .attr("r", 4)
        .attr('class', 'dot')
        .attr("cx", function(d) { return x(d.date); })
        .attr("cy", function(d) { return y(d.score); })
        .on("mouseover", function(d) {
          tooltip.html(function() {
            return tooltipContent(d.score, d.date, d.createdBy);
          });

          var tooltipX = +x(d.date) + margin.left + 10;
          var tooltipY = +y(d.score) + margin.top;
          var tooltipWidth = tooltip.node().offsetWidth;
          var tooltipHeight = tooltip.node().offsetHeight;
          var tooltipMargin = -1 * tooltipHeight / 2 + "px 0 0 0";

          if (tooltipX > width/2) {
            tooltipX = tooltipX - tooltipWidth - 20;
            tooltip.classed("d3-tooltip--right", true);
          }
          else {
            tooltip.classed("d3-tooltip--right", false);
          }

          tooltip
            .style("left", tooltipX + "px")
            .style("top", tooltipY + "px")
            .style("margin", tooltipMargin)
            .transition()
            .duration(300)
            .style("opacity", 1);
        })
        .on("mouseout", function(d) {
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);
        });

    context.append("path")
        .datum(data)
        .attr("class", showArea ? "area" : "aria--hidden")
        .attr("d", area2);

    context.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("class", "line")
        .attr("d", line2);

    context.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height2 + ")")
        .call(xAxis2);

    context.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.move, x.range());

  function render() {
    console.log('Render!');
  }

  function resize() {
    console.log('Resize!');

    render();
  }

  function brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
    var s = d3.event.selection || x2.range();
    x.domain(s.map(x2.invert, x2));
    focus.select(".area").attr("d", area);
    focus.select(".axis--x").call(xAxis);
    focus.select(".line").attr("d", line);
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
    focus.select(".line").attr("d", line);
    focus.selectAll(".dot").attr("cx", function(d) { return x(d.date); });
    context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
  }

  d3.select(window).on("resize", resize);
  render();
}

createChart (
  divID = 'chart',
  sourceData = myRubyData,
  tooltipContent = function (tooltipScore, tooltipDate, tooltipCreatedBy) {
    return "<b>Scrore: </b>" + tooltipScore + "%<br>" +
      "<b>Date: </b>" + tooltipDate + "<br>" +
      "<b>Scored by: </b>" + tooltipCreatedBy;
  },
  showArea = true,
  yAxisValue = [0, 100],
  yAxisTicksNum = 10,
  yAxisTickFormat ="%"
);

createChart (
  divID = 'chart2',
  sourceData = myRubyData2,
  tooltipContent = function (tooltipScore) {
    return "<b>Num: </b>" + tooltipScore + "<br>";
  },
  showArea = true,
  yAxisValue = [1, 4],
  yAxisTicksNum = 4,
  yAxisTickFormat =""
);
