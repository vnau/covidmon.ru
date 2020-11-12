import React from 'react';
import { RouteComponentProps } from 'react-router';
import { withRouter } from 'react-router-dom';
import './App.css';
import '../node_modules/react-vis/dist/style.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';
import '../node_modules/font-awesome/css/font-awesome.min.css';
import { Line, Bar } from 'react-chartjs-2';
import 'chartjs-plugin-annotation';
import moment from 'moment';
import LazyLoad from 'react-lazyload';
import { Button } from "react-bootstrap";

export interface Series {
  title: string;
  color: string;
  series: (number | null)[];
  hidden?: boolean;
}

export interface Props {
  type: string;
  title: string;
  dates: Date[];
  series: Series[];
  language: string;
  signedValues: boolean;
  min?: number;
  max?: number;
  onShowModal: ((title: string, content: JSX.Element) => void)
}

export interface State {
  type: string;
  title: string;
  chartData: any;
  chartOptions: {};
  language: string;
}

class Chart extends React.Component<RouteComponentProps<{}> & Props, State> {
  constructor(props: RouteComponentProps<{}> & Props, state: State) {
    super(props);
    this.state = this.createChartState(props.type, props.title, props.dates, props.series, props.language, props.signedValues, props.min, props.max);
  }

  async componentDidMount() {
    if (this.props.series) {
      this.setState(this.createChartState(this.props.type, this.props.title, this.props.dates, this.props.series, this.props.language, this.props.signedValues, this.props.min, this.props.max));
    }
  }

  async componentWillReceiveProps(nextProps: any) {
    this.setState(this.createChartState(nextProps.type, nextProps.title, nextProps.dates, nextProps.series, nextProps.language, nextProps.signedValues, nextProps.min, nextProps.max));
  }

  createChart(title: string, values: (number | null)[] | null | undefined, lineColor: string, type: string, id: number, hidden: boolean): any {
    if (values === null)
      values = [];

    const showLines = type === "line";

    return {
      hidden,
      label: title,
      xAxisID: id,
      fill: type !== 'line' && type !== 'point',
      lineTension: 0,
      backgroundColor: lineColor,
      borderColor: showLines ? lineColor : 'rgba(255,255,255,0)',
      borderCapStyle: 'butt',
      borderDash: [0],
      borderDashOffset: 0.0,
      borderWidth: 3,
      borderJoinStyle: 'miter',
      pointBorderColor: lineColor,
      pointBackgroundColor: lineColor,
      pointBorderWidth: 1,
      pointHoverRadius: showLines ? 3 : 4,
      pointHoverBackgroundColor: lineColor,
      pointHoverBorderColor: lineColor,
      pointHoverBorderWidth: 2,
      pointRadius: showLines ? 2 : 3,
      pointHitRadius: 5,
      barPercentage: 0.8,
      categoryPercentage: 1,
      data: values,
      spanGaps: true,
    };
  }

  createChartData(labels: Date[], charts: any[]): any {

    return {
      labels: labels,
      datasets: charts
    };

  }

  createChartState(type: string, title: string, dates: Date[], series: Series[], language: string, signedValues: boolean, min?: number, max?: number): State {
    const chartData = this.createChartData(dates,
      series.map((v, id) => this.createChart(v.title, v.series, v.color, type, id, !!v.hidden)).filter(s => s));

    const showLegend = series && series.filter(s => !s.title.includes(language === 'ru' ? 'прогноз' : 'forecast')).length > 1;
    const legend = !showLegend ? null : {
      position: 'top',
      labels: {
        usePointStyle: true,
        boxWidth: 6,
        filter: (legendItem: any, data: any) => {
          return !legendItem.text.includes(language === 'ru' ? 'прогноз' : 'forecast');
        }
      },
    };
    const axesIds = Array.from(Array(series.length).keys());
    const xAxes = axesIds.map(function (id: number): {} {
      return {
        id: id,
        display: id < 1,
        stacked: type === "stack",
        type: 'time',
        offset: true,
        ticks: {
          major: { enabled: true, fontStyle: 'bold' },
        },
        time: {
          displayFormats: {
            'day': 'DD',
            'week': 'MMM DD',
            'month': 'MMM',
            'year': 'YYYY',
          }
        }
      };
    });

    const chartOptions = {
      legend,
      scales: {
        yAxes: [{
          stacked: type === "stack",
          //type: 'logarithmic',
          display: true,
          ticks: {
            min: min,
            max: max,
            suggestedMin: 0,
            suggestedMax: 10,
            callback: function (value: any) {
              value = Math.abs(value);
              var ranges = [{ divider: 1e6, suffix: 'M' }, { divider: 1e3, suffix: 'k' }];
              function formatNumber(n: any) {
                for (var i = 0; i < ranges.length; i++) {
                  if (n >= ranges[i].divider) {
                    return (n / ranges[i].divider).toString() + ranges[i].suffix;
                  }
                }
                return n;
              }
              return formatNumber(value);
            }
          }
        }],
        xAxes
      },
      // annotation: {
      //   annotations: annotations,
      // },
      tooltips: {
        mode: 'index',
        callbacks: {
          title: function (items: any, data: any): any {
            return moment(items[0].xLabel).format('DD.MM.YYYY, ddd');//this._data.labels[tooltipItem[0].index];
          },
          label: function (t: any, d: any): any {
            var xLabel = d.datasets[t.datasetIndex].label;
            if (!t.yLabel || t.yLabel === 'NaN')
              return null;
            var yLabel = t.yLabel;
            if (signedValues)
              yLabel = +yLabel > 0 ? '+' + yLabel.toLocaleString() : yLabel.toLocaleString();
            else
              yLabel = +yLabel < 0 ? ((-yLabel).toLocaleString()) : yLabel.toLocaleString();

            return `${xLabel}: ${yLabel}`;
          }
        }
      },
      responsive: true,
      maintainAspectRatio: true,
    };

    return {
      type,
      title,
      chartData,
      chartOptions,
      language,
    };
  }

  renderChart() {
    var chart = <div></div>
    if (this.state.type === 'line' || this.state.type === 'point' || this.state.type === 'stackline') {
      chart = <Line data={this.state.chartData} height={170} options={this.state.chartOptions} />
    } else if (this.state.type === 'bar' || this.state.type === 'stack') {
      chart = <Bar data={this.state.chartData} height={170} options={this.state.chartOptions} />
    }
    return <main>{chart}</main>
  }

  render() {
    var isReactSnap = (navigator.userAgent === 'ReactSnap');

    if (isReactSnap)
      return (
        <main>
          <h5>{this.state.title}</h5>
          <div>
            <ul className='list-group'>
              {this.state.chartData.datasets.map((d: any) => <li className='list-group-item'></li>)}
            </ul>
          </div>
        </main>
      )
    else if (this.props.onShowModal === undefined) {
      return <main>{this.renderChart()}</main>
    }
    else return (
      <main>
        <Button className="float-right" variant="light" onClick={() => this.props.onShowModal(this.state.title, this.renderChart())}>
          <i className="fa fa-arrows-alt text-secondary"></i>
        </Button>
        <h5>{this.state.title}</h5>
        <div>
          <LazyLoad height={311} offset={100}>
            {this.renderChart()}
          </LazyLoad>
        </div>
      </main>
    );
  }
}

export default withRouter(Chart);
