import React, { ChangeEvent } from 'react';
import { RouteComponentProps } from 'react-router';
import { Link, withRouter } from 'react-router-dom';
import './App.css';
import '../node_modules/react-vis/dist/style.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';
import '../node_modules/font-awesome/css/font-awesome.min.css';
import Chart from './Chart';
import { Props as ChartProps, Series } from './Chart';
import 'chartjs-plugin-annotation';
import moment from 'moment';
import LazyLoad from 'react-lazyload';

interface ChartRow {
  anchor: string,
  chart1: ChartProps,
  chart2: ChartProps,
}

interface IRegionSeries {
  dates: Date[];
  confirmed: number[];
  recovered: number[];
  deaths: number[];
  tests: number[];
  critical: number[];
  hospital: number[];
  observator: number[];
}

export interface Props {
  series: any;
  regionData: any;
  language: string;
  region: string;
  regionDat: string;
  onShowModal: ((title: string, content:JSX.Element)=> void);
}

export interface State {
  chartRows: ChartRow[]
  region: string;
  regionDat: string;
  language: string;
}

const colorBlue = '#007bff'
const colorRed = '#dc3545';
const colorOrange = '#ffc107';
const colorOrangeTr = '#ffc107A0';
const colorOrangeRed = '#ed7b26';
const colorGreen = '#28a745';
const colorLime = '#93b426';

class RegionCharts extends React.Component<RouteComponentProps<{}> & Props, State> {
  constructor(props: RouteComponentProps<{}> & Props, state: State) {
    super(props);
    this.state = this.getChartsState(props.series, props.region, props.regionDat, props.language);
  }

  async componentDidMount() {
    if (this.props.series) {
      this.setState(this.getChartsState(this.props.series, this.props.region, this.props.regionDat, this.props.language));
    }
  }

  async componentWillReceiveProps(nextProps: any) {
    this.setState(this.getChartsState(nextProps.series, nextProps.region, nextProps.regionDat, nextProps.language));
  }

  getDiff(values: (number | null)[] | null): (number | null)[] {
    if (values === null)
      return [];
    if (values)
      return values.slice(1).map((item, index) =>
        (item === null || item === undefined || values[index] === null) ? null : Math.round(item - values[index]!)
      );
    else return [];
  }

  getVal(arr: (number | null)[], index: number): number {
    return (arr && arr[index]) ? arr[index] as number : 0;
  }

  getChartsState(series: IRegionSeries, region: string, regionDat: string, language: string): State {
    var isReactSnap = (navigator.userAgent === 'ReactSnap');

    var chartRows: ChartRow[] = [];
    var dates: Date[] = series.dates.map(v => v);
    const confirmed = series.confirmed;
    const recovered = series.recovered;

    var diffConfirmed = this.getDiff(confirmed).map(x => x ? x : null);
    var diffRecovered = this.getDiff(series.recovered).map(x => x ? -x : null);
    var diffDeaths = this.getDiff(series.deaths).map(v => v ? -v : v);
    var diffTests = series.tests ? this.getDiff(series.tests) : [];

    var spread = confirmed.map((v, i) => {
      return i >= 8 ? Math.round(100 * (confirmed[i] - confirmed[i - 4]) /
        (confirmed[i - 4] - confirmed[i - 8])) / 100 : null;
    })

    const sick = confirmed.map((v, i) => v - recovered[i] - ((series.deaths && series.deaths[i]) ? series.deaths[i] : 0));
    const sickCritical = series.critical;
    const sickHome = sick.map((v, i) => v && series.hospital && series.hospital[i] && v > series.hospital[i] ? v - series.hospital[i] : null);
    const sickHospital = series.hospital ? series.hospital.map((v, i) => v && series.critical && series.critical[i] ? v - series.critical[i] : null) : [];
    const sickUnknown = sick.map((v, i) => Math.max(0, v - this.getVal(series.critical, i) - this.getVal(sickHome, i) - this.getVal(sickHospital, i)));
    const diffSickCritical = this.getDiff(sickCritical);
    const diffSickHome = this.getDiff(sickHome);
    const diffSickHospital = this.getDiff(sickHospital);
    const diffSickUnknown = this.getDiff(sickUnknown);

    var sickRelative = sick.map((v, i) => {
      return i >= 1 && sick[i] && sick[i - 1] ? (Math.round(1000 * (sick[i]) /
        (sick[i - 1])) / 10 - 100) / 1 : null;
    })

    chartRows.push({
      anchor: "cases",
      chart1: {
        type: "stack", dates: dates, language, title: `Случаев всего в ${regionDat}`, signedValues: false,
        series: [
          { series: series.deaths, color: colorRed, title: language === 'ru' ? 'Умерло' : 'Deaths' },
          { series: sick, color: colorOrange, title: language === 'ru' ? 'Болеет' : 'Sick' },
          { series: series.recovered, color: colorGreen, title: language === 'ru' ? 'Выздоровело' : 'Recovered' }
        ],
        onShowModal: this.props.onShowModal,
      },
      chart2: {
        type: "stack", dates: dates.slice(1), language, title: `События по дням в ${regionDat}`, signedValues: false,
        series: [
          { series: diffDeaths, color: colorRed, title: language === 'ru' ? 'Умерло' : 'Deaths' },
          { series: diffConfirmed, color: colorOrange, title: language === 'ru' ? 'Выявлено' : 'Confirmed' },
          { series: diffRecovered, color: colorGreen, title: language === 'ru' ? 'Выздоровело' : 'Recovered' }
        ],
        onShowModal: this.props.onShowModal,
      }
    });

    chartRows.push({
      anchor: "sick",
      chart1: {
        type: "stack", dates, language, title: `Количество больных в ${regionDat}`, signedValues: false,
        series: [
          { series: sickCritical, color: colorOrangeRed, title: language === 'ru' ? 'В тяжёлом состоянии' : "Critical" },
          { series: sickHospital, color: colorOrange, title: language === 'ru' ? 'В стационарах' : "Hospital" },
          { series: sickUnknown, color: colorOrangeTr, title: language === 'ru' ? 'Болеет (не уточнено)' : "Sick (N/A)" },
          { series: sickHome, color: colorLime, title: language === 'ru' ? 'Амбулаторно' : "Confirmed" }
        ],
        onShowModal: this.props.onShowModal,
      },
      chart2: {
        type: "stack", dates: dates.slice(1), language, title: `Изменение количества больных в ${regionDat}`, signedValues: true,
        series: [
          { series: diffSickCritical, color: colorOrangeRed, title: language === 'ru' ? 'В тяжёлом состоянии' : "Critical" },
          { series: diffSickHospital, color: colorOrange, title: language === 'ru' ? 'В стационарах' : "Hospital" },
          { series: diffSickUnknown, color: colorOrangeTr, title: language === 'ru' ? 'Болеет (не уточнено)' : "Sick (N/A)", hidden: !!(series.hospital) },
          { series: diffSickHome, color: colorLime, title: language === 'ru' ? 'Амбулаторно' : "Confirmed" }
        ],
        onShowModal: this.props.onShowModal,
      }
    });

    chartRows.push({
      anchor: "spread",
      chart1: {
        type: "bar", dates, language, title: `Коэффициент распространения`, signedValues: false, max: 6,
        series: [
          { series: spread, color: colorOrange, title: language === 'ru' ? 'Коэффициент распространения' : "Spread coefficient", }
        ],
        onShowModal: this.props.onShowModal,
      },
      chart2: {
        type: "bar", dates, language, title: `Относительное изменение количества больных, %`, signedValues: true, min: -20, max: 100,
        series: [
          { series: sickRelative, color: colorOrange, title: language === 'ru' ? 'Относительное изменение количества больных, %' : 'Spread coefficient', }
        ],
        onShowModal: this.props.onShowModal,
      }
    });

    if (series.tests) {
      chartRows.push({
        anchor: "tests",
        chart1: {
          type: "bar", dates, language, title: `График тестирования в ${regionDat}`, signedValues: false,
          series: [{ series: series.tests, color: colorBlue, title: language === 'ru' ? 'Тестов всего' : 'Tested' }],
          onShowModal: this.props.onShowModal,
        },
        chart2: {
          type: "bar", dates: dates.slice(1), language, title: `Проведено тестов посуточно в ${regionDat}`, signedValues: false,
          series: [{ series: diffTests, color: colorBlue, title: language === 'ru' ? 'Тестирований в сутки' : 'Daily tests' }],
          onShowModal: this.props.onShowModal,
        }
      });
    }

    return ({
      chartRows,
      region,
      regionDat,
      language,
    });
  }

  render() {
    var rows = this.state.chartRows.map(row =>
      <a id={row.anchor} key={row.anchor}>
        <div className="row">
          <div className="col-sm">
            <Chart {...row.chart1} />
          </div>
          <div className="col-sm">
            <Chart {...row.chart2} />
          </div>
        </div>
      </a>
    );

    return (
      <main>
        <div className="px-3 pb-3 pb-md-4 mx-auto text-center">
          {rows}
        </div>
      </main >
    );
  }
}

export default withRouter(RegionCharts);
