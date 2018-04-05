class Timeline {
  constructor(chartWrapper, config, b) {
    this.config = config;
    this.chartWrapper = chartWrapper;
    this.config.yAxisTickFormat = this.config.yAxisTickFormat || '';

    this.data = this.parseData(config.data);

    this.svg = d3.select(this.chartWrapper).append('svg')

    this.dotSize = 4;
    this.dotPlaceholder = 6;
    this.timelinePlaceholder = 75;
    this.marginTop = 8;
    this.marginRight = 20;
    this.marginLeft = 40;
    this.marginBottom = 30;
    this.spaceAfterMainChart = 35;

    this.render();

    const x = this.x;
    const x2 = this.x2;
    const y = this.y;
    const y2 = this.y2;

    this.clipId = `clip-${this.chartWrapper.id}`; 
    this.svg.append('defs').append('clipPath')
      .attr('id', this.clipId)
      .append('rect')
      .attr('class', 'clipRect')
      .attr('width', this.width)
      .attr('height', this.chartHeight + (this.dotPlaceholder * 2))
      .attr('transform', `translate( 0, -${this.dotPlaceholder} )`);

    const focus = this.svg.append('g')
      .attr('class', 'focus')
      .attr('transform', `translate(${this.chartMargin.left}, ${this.chartMargin.top})`);

    const context = this.svg.append('g')
      .attr('class', 'context')
      .attr('transform', `translate(${this.timelineMargin.left}, ${this.timelineMargin.top})`);

    const tooltip = d3.select(this.chartWrapper).append('div')
      .attr('class', 'd3-tooltip')
      .style('opacity', 0);

    // Scale the range of the data
    x.domain(d3.extent(this.data, d => d.date));
    y.domain(config.yAxisValue);
    x2.domain(x.domain());
    y2.domain(y.domain());

    focus.append('path')
      .datum(this.data)
      .attr('class', 'area')
      .attr('clip-path', `url(#${this.clipId})`)
      .attr('d', this.chartArea);

    focus.append('path')
      .datum(this.data)
      .attr('fill', 'none')
      .attr('class', 'line')
      .attr('clip-path', `url(#${this.clipId})`)
      .attr('d', this.chartLine);

    focus.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', `translate(0, ${this.chartHeight})`)
      .call(this.xAxis);

    focus.append('g')
      .attr('class', 'axis axis--y')
      .call(this.yAxis);

    focus.append('rect')
      .attr('class', 'zoom')
      .attr('width', this.width)
      .attr('height', this.chartHeight)
      .call(this.zoom);

    d3.select(this.chartWrapper)
      .style('position', 'relative');

    // Add the scatterplot
    focus.append('g')
      .attr('class', 'dots')
      .attr('clip-path', `url(#${this.clipId})`)
      .selectAll('dot')
      .data(this.data)
      .enter()
      .append('circle')
      .attr('r', this.dotSize)
      .attr('class', 'dot')
      .attr('cx', d => x(d.date))
      .attr('cy', d => y(d.score))
      .on('mouseover', this.showTooltip.bind(this))
      .on('mouseout', this.hideTooltip.bind(this));

    context.append('path')
      .datum(this.data)
      .attr('class', 'area')
      .attr('clip-path', `url(#${this.clipId})`)
      .attr('d', this.timelineArea);

    context.append('path')
      .datum(this.data)
      .attr('fill', 'none')
      .attr('class', 'line')
      .attr('clip-path', `url(#${this.clipId})`)
      .attr('d', this.timelineLine);

    context.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', `translate(0, ${this.timelineHeight})`)
      .call(this.xAxis2);

    context.append('g')
      .attr('class', 'brush')
      .call(this.brush)
      .call(this.brush.move, x.range());
  }

  render() {
    const focus = this.svg.select('.focus');
    const context = this.svg.select('.context');
    const data = [...this.data];
    if (this.config.tabsWrapper) {
      this.wrapperWidth = d3
        .select(this.config.tabsWrapper)
        .node()
        .getBoundingClientRect()
        .width;
    } else {
      this.wrapperWidth = this.chartWrapper.clientWidth;
    }
    this.wrapperHeight = this.config.height;

    this.chartMargin = {
      top: this.marginTop,
      right: this.marginRight,
      bottom: this.timelinePlaceholder + this.spaceAfterMainChart,
      left: this.marginLeft,
    };
    this.timelineMargin = {
      top: (this.wrapperHeight - this.timelinePlaceholder),
      right: this.marginRight,
      bottom: this.marginBottom,
      left: this.marginLeft,
    };

    this.svg
      .attr('width', this.wrapperWidth)
      .attr('height', this.wrapperHeight);

    this.width = this.wrapperWidth - this.chartMargin.left - this.chartMargin.right;
    this.graphWidth = this.width - this.dotPlaceholder;
    this.chartHeight = this.wrapperHeight - this.chartMargin.top - this.chartMargin.bottom;
    this.timelineHeight = this.timelinePlaceholder - this.timelineMargin.bottom;

    // Set the ranges
    this.x = d3.scaleTime().range([this.dotPlaceholder, this.graphWidth]);
    this.x2 = d3.scaleTime().range([this.dotPlaceholder, this.graphWidth]);
    this.y = d3.scaleLinear().range([this.chartHeight, 0]);
    this.y2 = d3.scaleLinear().range([this.timelineHeight, 0]);
    const x = this.x;
    const x2 = this.x2;
    const y = this.y;
    const y2 = this.y2;

    // Define the axes
    this.xAxis = d3.axisBottom(x)
      .tickSize(-this.chartHeight)
      .tickSizeOuter(0)
      .tickPadding(10);
    this.xAxis2 = d3.axisBottom(x2);
    this.yAxis = d3.axisLeft(y)
      .tickSize(-this.width)
      .ticks(this.config.yAxisTicksNum)
      .tickFormat(d => d + this.config.yAxisTickFormat);

    // Define the brush
    this.brush = d3.brushX()
      .extent([[this.dotPlaceholder, 0], [this.graphWidth, this.timelineHeight]])
      .on('brush end', this.brushed.bind(this));

    // Define the zoom
    this.zoom = d3.zoom()
      .scaleExtent([1, data.length * 12])
      .translateExtent([[this.dotPlaceholder, 0], [this.graphWidth, this.hartHeight]])
      .extent([[this.dotPlaceholder, 0], [this.graphWidth, this.hartHeight]])
      .on('zoom', this.zoomed.bind(this));

    this.chartArea = d3.area()
      .curve(d3.curveLinear)
      .x(d => x(d.date))
      .y0(this.chartHeight)
      .y1(d => y(d.score));

    this.timelineArea = d3.area()
      .curve(d3.curveLinear)
      .x(d => x2(d.date))
      .y0(this.timelineHeight)
      .y1(d => y2(d.score));

    this.chartLine = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.score));

    this.timelineLine = d3.line()
      .x(d => x2(d.date))
      .y(d => y2(d.score));

    this.svg.select('.clipRect')
      .attr('width', this.width);

    // Scale the range of the data
    x.domain(d3.extent(data, d => d.date));
    y.domain(this.config.yAxisValue);
    x2.domain(x.domain());
    y2.domain(y.domain());
  }

  resize() {
    const focus = this.svg.select('.focus');
    const context = this.svg.select('.context');

    this.render();

    focus.select('.axis--x').call(this.xAxis);
    focus.select('.axis--y').call(this.yAxis);
    focus.select('.area').attr('d', this.chartArea);
    focus.select('.line').attr('d', this.chartLine);
    focus.selectAll('.dot').attr('cx', d => this.x(d.date));
    focus.select('.zoom').attr('width', this.width);

    context.select('.axis--x').call(this.xAxis2);
    context.select('.area').attr('d', this.timelineArea);
    context.select('.line').attr('d', this.timelineLine);
    context.select('.brush').call(this.brush)
      .call(this.brush.move, this.x.range());
  }

  parseData(sourseData = []) {
    const parseDate = d3.timeParse('%Y-%m-%dT%H:%M:%S.%LZ');
    const parsedData = sourseData
      .map(d => ({
        ...d,
        date: parseDate(d.date),
        createdBy: d.created_by,
      }));
    if (parsedData.length === 1) {
      parsedData.unshift({
        date: new Date(parsedData[0].date.getFullYear(), parsedData[0].date.getMonth(), parsedData[0].date.getDate() - 1),
        score: this.config.yAxisValue[0],
        createdBy: 'Default initial score'
      });
    }
    return parsedData;
  }

  zoomed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush') return; // ignore zoom-by-brush
    const t = d3.event.transform;
    this.x.domain(t.rescaleX(this.x2).domain());
    const focus = this.svg.select('.focus')
    const context = this.svg.select('.context')
    focus.select('.area').attr('d', this.chartArea);
    focus.select('.axis--x').call(this.xAxis);
    focus.select('.line').attr('d', this.chartLine);
    focus.selectAll('.dot').attr('cx', d => this.x(d.date));
    context.select('.brush').call(this.brush.move, this.x.range().map(t.invertX, t));
  }

  brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return; // ignore brush-by-zoom
    const s = d3.event.selection || this.x2.range();
    const ratio = (this.graphWidth - 6) / (s[1] - s[0]);
    const focus = this.svg.select('.focus')
    this.x.domain(s.map(this.x2.invert, this.x2));
    focus.select('.area').attr('d', this.chartArea);
    focus.select('.axis--x').call(this.xAxis);
    focus.select('.line').attr('d', this.chartLine);
    focus.selectAll('.dot').attr('cx', d => this.x(d.date));
    this.svg.select('.zoom').call(this.zoom.transform, d3.zoomIdentity
      .scale(ratio)
      .translate(-s[0] + (this.dotPlaceholder / ratio), 0));
  }

  showTooltip(d) {
    const tooltip = d3.select(this.chartWrapper).select('.d3-tooltip');
    tooltip.html(() => this.config.tooltipContent(d));

    let tooltipX = +this.x(d.date) + this.chartMargin.left + (this.dotPlaceholder * 2);
    const tooltipY = +this.y(d.score) + this.chartMargin.top;
    const tooltipWidth = tooltip.node().offsetWidth;
    const tooltipHeight = tooltip.node().offsetHeight;
    const tooltipMargin = `${(-1 * tooltipHeight) / 2}px 0 0 0`;

    if (tooltipX > this.width / 2) {
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

  hideTooltip() {
    const tooltip = d3.select(this.chartWrapper).select('.d3-tooltip');

    tooltip.transition()
      .duration(500)
      .style('opacity', 0);
  }

  update(data) {
    const updatedData = this.parseData(data);
    const focus = this.svg.select('.focus');
    const context = this.svg.select('.context');

    this.x.domain(d3.extent(updatedData, d => d.date));
    this.y.domain(this.config.yAxisValue);
    this.x2.domain(this.x.domain());
    this.y2.domain(this.y.domain());

    focus.select('.axis--x')
      .transition()
      .call(this.xAxis);

    context.select('.axis--x')
      .transition()
      .call(this.xAxis2);

    context.select('.brush')
      .call(this.brush.move, null);

    focus.select('.line')
      .datum(updatedData)
      .attr('d', this.chartLine);

    focus.select('.area')
      .datum(updatedData)
      .attr('d', this.chartArea);

    context.select('.line')
      .datum(updatedData)
      .attr('d', this.timelineLine);

    context.select('.area')
      .datum(updatedData)
      .attr('d', this.timelineArea);

    const dots = focus.select('.dots').selectAll('.dot')
      .data(updatedData);

    dots.enter()
      .append('circle')
      .attr('r', this.dotSize)
      .attr('class', 'dot')
      .attr('cx', d => this.x(d.date))
      .attr('cy', d => this.y(d.score))
      .on('mouseover', this.showTooltip.bind(this))
      .on('mouseout', this.hideTooltip.bind(this));

    dots
      .attr('cx', d => this.x(d.date))
      .attr('cy', d => this.y(d.score));

    dots.exit()
      .remove();
  }
}
