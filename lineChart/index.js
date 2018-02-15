var svg = d3.select("svg"),
    margin = {top: 20, right: 20, bottom: 30, left: 30},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var parseTime = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ");

var x = d3.scaleTime()
    .rangeRound([0, width]);

var y = d3.scaleLinear()
    .rangeRound([height, 0]);


var myDate = ["2018-01-29T13:07:15.038Z","2018-02-07T11:16:35.002Z","2018-02-07T11:19:40.537Z"];
var myValue = [100, 200, 90];

var myData = [];
myDate.forEach(function(currentDate, index) {
  return myData.push({date: parseTime(currentDate), value: myValue[index]})
});

var line = d3.line()
  .x(function(d) { return x(d.date); })
  .y(function(d) { return y(d.value); });

  x.domain(d3.extent(myData, function(d) { return d.date; }));
  y.domain(d3.extent(myData, function(d) { return d.value; }));

  g.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

  g.append("g")
      .call(d3.axisLeft(y));

  g.append("path")
      .datum(myData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 2)
      .attr("d", line);
