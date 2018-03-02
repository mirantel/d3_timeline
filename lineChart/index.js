class timeline {
  constructor(chartWrapper, config) {
    const data = parseData(config.data);
    const svg = d3.select(chartWrapper).append('svg');
    this.wrapperWidth = chartWrapper.clientWidth;
    this.wrapperHeight = chartWrapper.clientHeight;

    svg
      .attr('width', this.wrapperWidth)
      .attr('height', this.wrapperHeight);

    const tooltip = d3.select(chartWrapper).append('div')
      .attr('class', 'd3-tooltip')
      .style('opacity', 0);

    const dotSize = 4;
    const dotPlaceholder = 6;
    let timelineHeight = 75;

    const chartMargin = {
      top: 8,
      right: 20,
      bottom: timelineHeight + 35,
      left: 40,
    };
    const timelineMargin = {
      top: (this.wrapperHeight - timelineHeight),
      right: 20,
      bottom: 30,
      left: 40,
    };
    timelineHeight = timelineHeight - timelineMargin.bottom;
    const width = this.wrapperWidth - chartMargin.left - chartMargin.right;
    const graphWidth = width - dotPlaceholder;
    const chartHeight = this.wrapperHeight - chartMargin.top - chartMargin.bottom;

    // Set the ranges
    const x = d3.scaleTime().range([dotPlaceholder, graphWidth]);
    const x2 = d3.scaleTime().range([dotPlaceholder, graphWidth]);
    const y = d3.scaleLinear().range([chartHeight, 0]);
    const y2 = d3.scaleLinear().range([timelineHeight, 0]);

    // Define the axes
    const xAxis = d3.axisBottom(x)
      .tickSize(-chartHeight)
      .tickSizeOuter(0)
      .tickPadding(10);
    const xAxis2 = d3.axisBottom(x2);
    const yAxis = d3.axisLeft(y)
      .tickSize(-width)
      .ticks(config.yAxisTicksNum)
      .tickFormat(d => d + config.yAxisTickFormat);

    // Define the brush
    const brush = d3.brushX()
      .extent([[dotPlaceholder, 0], [graphWidth, timelineHeight]])
      .on('brush end', brushed);

    // Define the zoom
    const zoom = d3.zoom()
      .scaleExtent([1, data.length * 12])
      .translateExtent([[dotPlaceholder, 0], [graphWidth, this.hartHeight]])
      .extent([[dotPlaceholder, 0], [graphWidth, this.hartHeight]])
      .on('zoom', zoomed);

    const chartArea = d3.area()
      .curve(d3.curveLinear)
      .x(d => x(d.date))
      .y0(chartHeight)
      .y1(d => y(d.score));

    this.timelineArea = d3.area()
      .curve(d3.curveLinear)
      .x(d => x2(d.date))
      .y0(timelineHeight)
      .y1(d => y2(d.score));

    const chartLine = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.score));

    this.timelineLine = d3.line()
      .x(d => x2(d.date))
      .y(d => y2(d.score));

    this.clipId = `clip-${Math.floor(Math.random() * 100000)}`;
    svg.append('defs').append('clipPath')
      .attr('id', this.clipId)
      .append('rect')
      .attr('width', width)
      .attr('height', chartHeight + (dotPlaceholder * 2))
      .attr('transform', `translate( 0, -${dotPlaceholder} )`);

    const focus = svg.append('g')
      .attr('class', 'focus')
      .attr('transform', `translate(${chartMargin.left}, ${chartMargin.top})`);

    const context = svg.append('g')
      .attr('class', 'context')
      .attr('transform', `translate(${timelineMargin.left}, ${timelineMargin.top})`);

    // Scale the range of the data
    x.domain(d3.extent(data, d => d.date));
    y.domain(config.yAxisValue);
    x2.domain(x.domain());
    y2.domain(y.domain());

    if (config.showArea) {
      focus.append('path')
        .datum(data)
        .attr('class', 'area')
        .attr('clip-path', `url(#${this.clipId})`)
        .attr('d', chartArea);
    }

    focus.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('class', 'line')
      .attr('clip-path', `url(#${this.clipId})`)
      .attr('d', chartLine);

    focus.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis);

    focus.append('g')
      .attr('class', 'axis axis--y')
      .call(yAxis);

    focus.append('rect')
      .attr('class', 'zoom')
      .attr('width', width)
      .attr('height', chartHeight)
      .call(zoom);

    d3.select(chartWrapper)
      .style('position', 'relative');

    // Add the scatterplot
    focus.append('g')
      .attr('class', 'dots')
      .attr('clip-path', `url(#${this.clipId})`)
      .selectAll('dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('r', dotSize)
      .attr('class', 'dot')
      .attr('cx', d => x(d.date))
      .attr('cy', d => y(d.score))
      .on('mouseover', showTooltip)
      .on('mouseout', hideTooltip);

    if (config.showArea) {
      context.append('path')
        .datum(data)
        .attr('class', 'area')
        .attr('clip-path', `url(#${this.clipId})`)
        .attr('d', this.timelineArea);
    }

    context.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('class', 'line')
      .attr('clip-path', `url(#${this.clipId})`)
      .attr('d', this.timelineLine);

    context.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', `translate(0, ${timelineHeight})`)
      .call(xAxis2);

    context.append('g')
      .attr('class', 'brush')
      .call(brush)
      .call(brush.move, x.range());

    function parseData(sourseData) {
      const data = [];
      const parseDate = d3.timeParse('%Y-%m-%dT%H:%M:%S.%LZ');
      sourseData.forEach((item) => {
        return data.push({
          date: parseDate(item.date),
          score: item.score,
          createdBy: item.created_by,
        });
      });
      if (data.length === 1) {
        data.unshift({
          date: new Date(data[0].date.getFullYear(), data[0].date.getMonth(), data[0].date.getDate() - 1),
          score: config.yAxisValue[0],
        });
      }
      return data;
    }

    function showTooltip(d) {
      tooltip.html(() => config.tooltipContent(d));

      let tooltipX = +x(d.date) + chartMargin.left + (dotPlaceholder * 2);
      const tooltipY = +y(d.score) + chartMargin.top;
      const tooltipWidth = tooltip.node().offsetWidth;
      const tooltipHeight = tooltip.node().offsetHeight;
      const tooltipMargin = `${(-1 * tooltipHeight) / 2}px 0 0 0`;

      if (tooltipX > width / 2) {
        tooltipX = tooltipX - tooltipWidth - 20;
        tooltip.classed('d3-tooltip--right', true);
      } else {
        tooltip.classed('d3-tooltip--right', false);
      }

      tooltip
        .style('left', `${tooltipX}px`)
        .style('top', `${tooltipY}px`)
        .style('margin', tooltipMargin)
        .transition()
        .duration(300)
        .style('opacity', 1);
    }

    function hideTooltip() {
      tooltip.transition()
        .duration(500)
        .style('opacity', 0);
    }

    function brushed() {
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return; // ignore brush-by-zoom
      const s = d3.event.selection || x2.range();
      const ratio = (graphWidth - 6) / (s[1] - s[0]);
      x.domain(s.map(x2.invert, x2));
      focus.select('.area').attr('d', chartArea);
      focus.select('.axis--x').call(xAxis);
      focus.select('.line').attr('d', chartLine);
      focus.selectAll('.dot').attr('cx', d => x(d.date));
      svg.select('.zoom').call(zoom.transform, d3.zoomIdentity
        .scale(ratio)
        .translate(-s[0] + (dotPlaceholder / ratio), 0));
    }

    function zoomed() {
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush') return; // ignore zoom-by-brush
      const t = d3.event.transform;
      x.domain(t.rescaleX(x2).domain());
      focus.select('.area').attr('d', chartArea);
      focus.select('.axis--x').call(xAxis);
      focus.select('.line').attr('d', chartLine);
      focus.selectAll('.dot').attr('cx', d => x(d.date));
      context.select('.brush').call(brush.move, x.range().map(t.invertX, t));
    }
  }
}

const chart1Wrapper = document.getElementById('chart1');
const initialData = eval(d3.select('#select').property('value'));
const chart1 = new timeline(chart1Wrapper, {
  data: initialData,
  tooltipContent: d =>
    `<b>Scrore: </b>${d.score}%<br>
     <b>Date: </b>${d.date}<br>
     <b>Scored by: </b>${d.createdBy}`,
  showArea: true,
  yAxisValue: [1, 4],
  yAxisTicksNum: 4,
  yAxisTickFormat: '',
});

const chart2 = document.getElementById('chart2');
createChart(chart2, {
  data: scoreData,
  tooltipContent: d =>
    `<b>Scrore: </b>${d.score}%<br>
     <b>Date: </b>${d.date}<br>
     <b>Scored by: </b>${d.createdBy}`,
  showArea: true,
  yAxisValue: [0, 100],
  yAxisTicksNum: 10,
  yAxisTickFormat: '%',
});
