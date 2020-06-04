import React, { ChangeEvent } from 'react';
import { RouteComponentProps } from 'react-router';
import { Link, withRouter } from 'react-router-dom';
import './App.css';
import '../node_modules/react-vis/dist/style.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';
import '../node_modules/font-awesome/css/font-awesome.min.css';
import { Line, Bar } from 'react-chartjs-2';
import 'chartjs-plugin-annotation';
import moment from 'moment';
import { Extrapolate } from './Extrapolate'
import { withStyles, makeStyles } from '@material-ui/core/styles';
import { Slider } from '@material-ui/core';
import Chart, { Props as ChartProps, Series } from './Chart';

interface ChartRow {
  anchor: string,
  chart1: ChartProps,
  chart2: ChartProps,
}

/**
* Returns the index of the last element in the array where predicate is true, and -1
* otherwise.
* @param array The source array to search in
* @param predicate find calls predicate once for each element of the array, in descending
* order, until it finds one where predicate returns true. If such an element is found,
* findLastIndex immediately returns that element index. Otherwise, findLastIndex returns -1.
*/
export function findLastIndex<T>(array: Array<T>, predicate: (value: T, index: number, obj: T[]) => boolean): number {
  let l = array.length;
  while (l--) {
    if (predicate(array[l], l, array))
      return l;
  }
  return -1;
}

const useStyles = makeStyles({
  option: {
    fontSize: 15,
    '& > span': {
      marginRight: 10,
      fontSize: 18,
    },
  },
});

const PrettoSlider = withStyles({
  root: {
    color: '#52af77', //color: '#808080',
    height: 8,
  },
  thumb: {
    height: 24,
    width: 24,
    backgroundColor: '#fff',
    border: '2px solid currentColor',
    marginTop: -8,
    marginLeft: -12,
    '&:focus, &:hover, &$active': {
      boxShadow: 'inherit',
    },
  },
  active: {},
  valueLabel: {
    left: 'calc(-50% + 4px)',
  },
  track: {
    height: 8,
    borderRadius: 4,
  },
  rail: {
    height: 8,
    borderRadius: 4,
  },
})(Slider);


interface IRegionSeries {
  dates: Date[];
  confirmed: number[];
  recovered: number[];
  deaths: number[];
  tests: number[];
}

export interface Props {
  series: any;
  regionData: any;
  language: string;
  region: string;
  regionDat: string;
}

export interface State {
  incubationPeriod: number;
  caseFatalityRate: number;
  optDeathPercent: number;
  optOffset: number;
  region: string;
  regionDat: string;
  forecastDays: number;
  language: string;
  diffConfirmedForecast: (number | null)[] | null;
  diffDeathsForecast: (number | null)[] | null;
  diffRecoveredForecast: (number | null)[] | null;
  diffEstimatedForecast: (number | null)[];
  chartRows: ChartRow[];
}

const sinceDate = "3/4/20";
const lineColor1 = '#0076be';
const lineColor2 = '#52af77';
const lineColor1f = '#0076be60';
const lineColor2f = '#52af7760';
const colorBlue = '#007bff'
const colorRed = '#dc3545';
const colorRedTr = '#dc354560';
const colorOrange = '#ffc107';
const colorOrangeTr = '#ffc10760';
const colorOrangeRed = '#ed7b26';
const colorGreen = '#28a745';
const colorGreenTr = '#28a74560';
const colorLime = '#93b426';

class RegionForecast extends React.Component<RouteComponentProps<{}> & Props, State> {
  constructor(props: RouteComponentProps<{}> & Props, state: State) {
    super(props);
    this.state = {
      language: props.language,
      region: props.region,
      regionDat: props.regionDat,
      incubationPeriod: 21,
      caseFatalityRate: 2.1,
      optDeathPercent: 0,
      optOffset: 0,
      forecastDays: 7,
      diffConfirmedForecast: null,
      diffDeathsForecast: null,
      diffRecoveredForecast: null,
      diffEstimatedForecast: [],
      chartRows: [],
    }

    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleClickAuto = this.handleClickAuto.bind(this);
  }

  async componentDidMount() {
    if (this.props.series) {
      const state = this.getState(this.props.series, this.props.region, this.props.regionDat, this.state.caseFatalityRate, this.state.incubationPeriod, this.state.forecastDays, this.props.language, true);
      this.setState(state);
    }
  }

  async componentWillReceiveProps(nextProps: any) {
    const state = this.getState(nextProps.series, nextProps.region, nextProps.regionDat, this.state.caseFatalityRate, this.state.incubationPeriod, this.state.forecastDays, nextProps.language, true);
    this.setState(state);
  }

  getDistance(confirmed: number[], deaths: number[], caseFatalityRate: number, incubationPeriod: number): number {
    var sum = 0;
    for (var i = 0; i < deaths.length - incubationPeriod; i++) {
      const estimated = deaths[i + incubationPeriod] * 100 / caseFatalityRate;
      if (estimated + 10 < confirmed[i])
        return 10000000000000;
      sum += Math.abs(estimated - confirmed[i]);
    }
    return sum;
  }

  getForecastData(time: Date[], values: (number | null)[], forecastDays: number): (number | null)[] {
    //const sourceDays = time.length
    var backDays = 35;
    const sourceDaysFull = time.length;// findLastIndex(values, (v) => v !== null) + 1;//time.length;
    const sourceDays = findLastIndex(values, (v) => v !== null) + 1;

    const lastDate = time[sourceDays - 1];
    backDays = Math.min(backDays, sourceDays);
    const skipDays = Math.max(sourceDays - backDays, 0);
    const x = Array.from(Array(backDays).keys()).map(v => v + skipDays);
    const y: number[] = values.slice(skipDays, sourceDays).map(v => v ? v : 0);
    const ext = new Extrapolate(x, y, 3);

    const offs = 0;
    var estimated: (number | null)[] = [];
    var maxValue = 0;

    for (var i = 0; i < sourceDays; i++) {
      estimated[i] = values[i];
    }


    for (i = sourceDays; i < sourceDays + forecastDays; i++) {
      const val = Math.max(maxValue, (offs + ext.Approxn(i)));
      estimated[i] = val;
    }
    return estimated;
  }

  addDays(time: Date[], days: number): Date[] {
    const lastDate = time[time.length - 1];
    return time.concat(Array(days).fill(null).map((v, i) => moment(lastDate).add(i + 1, "days").toDate()));
  }

  addNulls(values: number[], days: number): number[] {
    return values.concat(Array(days).fill(null));
  }

  getDiff(values: number[] | null): (number | null)[] {
    if (values === null)
      return [];
    return values.slice(1).map((item, index) =>
      (item == null || values[index] === null) ? null : Math.round(item - values[index]));
  }

  reduceDiff(values: (number | null)[], firstValue: number) {
    var confirmedForecast: (number | null)[] = [];
    values?.reduce((cur, diff, i) => {
      if (diff != null) {
        confirmedForecast[i] = cur;
        return confirmedForecast[i + 1] = (cur != null ? cur : 0) + diff;
      } else {
        return cur;
      }
    }, firstValue);
    return confirmedForecast;
  }

  gaussianBlur(values: (number | null)[], window: number): number[] { // window with 95%
    const sigma = window / 4;
    const halfWidth = Math.ceil((window - 1) / 2);
    var weightGauss: number[] = [];
    for (var x = -halfWidth; x <= halfWidth; x++) {
      weightGauss[x + halfWidth] = Math.exp(-x * x / (2 * sigma * sigma)) / (sigma * Math.sqrt(2 * Math.PI));
    }

    return values.map((x, i) => weightGauss
      .reduce((sum, w, j) => sum + w * (values[Math.max(i + j - halfWidth, 0)] as number), 0));
  }

  getState(series: IRegionSeries, region: string, regionDat: string, caseFatalityRate: number, incubationPeriod: number, forecastDays: number, language: string, recalc: boolean): State | null {
    var isReactSnap = (navigator.userAgent === 'ReactSnap');
    if (!series)
      return null;

    var sourceDays = series.confirmed.length;

    var dates: Date[] = series.dates.map(v => v);
    const confirmed = series.confirmed;
    const recovered = series.recovered;

    var diffConfirmed = this.getDiff(series.confirmed).map(x => x ? x : null);
    var diffRecovered = this.getDiff(series.recovered).map(x => x ? x : null);
    var diffDeaths = this.getDiff(series.deaths);

    const maxForecastDays = 30;

    const stateDiffConfirmedForecast = recalc && !isReactSnap
      ? this.getForecastData(dates, diffConfirmed, maxForecastDays)
      : this.state.diffConfirmedForecast;

    const stateDiffDeathsForecast = recalc && !isReactSnap
      ? this.getForecastData(dates, diffDeaths, maxForecastDays)
      : this.state.diffDeathsForecast;

    const stateDiffRecoveredForecast = recalc && !isReactSnap
      ? this.getForecastData(dates, diffRecovered, maxForecastDays)
      : this.state.diffRecoveredForecast;

    const stateDiffEstimatedForecast = recalc && !isReactSnap
      ? this.gaussianBlur(stateDiffDeathsForecast ? stateDiffDeathsForecast : [], 6)
      : this.state.diffEstimatedForecast;


    //var curDiffDeathsForecast = diffDeathsForecast?.slice(0,sourceDays + forecastDays );
    //var curDiffConfirmedForecast = diffConfirmedForecast?.slice(0,sourceDays + forecastDays );
    /*
  await new Promise(v => {
    // find optimal distance
    var optDist = Number.MAX_VALUE;
    var optOffset = 0;
    var optDeathPercent = 0;
    for (var offset = 0; offset < 25; offset += 1) {
      for (var caseFatalityRate = 1; caseFatalityRate < 6; caseFatalityRate += 0.1) {
        const dist = this.getDistance(series.confirmed, series.deaths, caseFatalityRate, offset);
        if (dist < optDist) {
          optOffset = offset;
          optDeathPercent = Math.round(caseFatalityRate * 10) / 10;
          optDist = dist
        }
      }
    }

    this.setState({
      optOffset: optOffset,
      optDeathPercent: optDeathPercent,
    });

  });
  */

    const diffConfirmedForecast = (forecastDays > 0 && stateDiffConfirmedForecast)
      ? stateDiffConfirmedForecast
        .slice(0, sourceDays + forecastDays - 1)
        .map((x, i) => i < sourceDays - 1 || !x ? null : Math.round(x))
      : [];

    const confirmedForecast = (stateDiffConfirmedForecast)
      ? this.reduceDiff(stateDiffConfirmedForecast, confirmed[0])
        .slice(0, sourceDays + forecastDays)
        .map((x, i) => i < sourceDays - 1 || !x ? null : Math.round(x))
      : [];


    const diffRecoveredForecast = (forecastDays > 0 && stateDiffRecoveredForecast)
      ? stateDiffRecoveredForecast
        .slice(0, sourceDays + forecastDays - 1)
        .map((x, i) => i < sourceDays - 1 || !x ? null : Math.round(x))
      : [];

    const recoveredForecast = (stateDiffRecoveredForecast)
      ? this.reduceDiff(stateDiffRecoveredForecast, recovered[0])
        .slice(0, sourceDays + forecastDays)
        .map((x, i) => i < sourceDays - 1 || !x ? null : Math.round(x))
      : [];

    const diffDeathsForecast = (forecastDays > 0 && stateDiffDeathsForecast)
      ? stateDiffDeathsForecast
        .slice(0, sourceDays + forecastDays - 1)
        .map((x, i) => i < sourceDays - 1 || !x ? null : Math.round(x))
      : [];

    const deathsForecast = (forecastDays > 0 && stateDiffDeathsForecast)
      ? this.reduceDiff(stateDiffDeathsForecast, series.deaths[0])
        .slice(0, sourceDays + forecastDays)
        .map((x, i) => i < sourceDays - 1 ? null : (x ? Math.round(x) : x))
      : [];

    // shift time for all estimated series
    var estimated = this.reduceDiff(stateDiffEstimatedForecast, Math.round(series.deaths[0] * 100 / caseFatalityRate))
      .slice(incubationPeriod, sourceDays)
      .map(v => v ? Math.round(v * 100 / caseFatalityRate) : 0);

    var estimatedForecast = this.reduceDiff(stateDiffEstimatedForecast, Math.round(series.deaths[0] * 100 / caseFatalityRate))
      .slice(incubationPeriod, sourceDays + forecastDays)
      .map((v, i) => i >= sourceDays - incubationPeriod - 1 && v ? Math.round(v * 100 / caseFatalityRate) : null);

    var diffEstimated = stateDiffEstimatedForecast
      .slice(incubationPeriod, sourceDays - 1)
      .map(v => v ? Math.round(v * 100 / caseFatalityRate) : null);

    var diffEstimatedForecast = stateDiffEstimatedForecast
      .slice(incubationPeriod, sourceDays + forecastDays - 1)
      .map((v, i) => i >= sourceDays - incubationPeriod - 1 && v ? Math.round(v * 100 / caseFatalityRate) : null);

    if (forecastDays > 0) {
      dates = this.addDays(dates, forecastDays);
    }

    var rows: ChartRow[] = [];

    rows.push({
      anchor: "confirmed",
      chart1: {
        type: "line", dates, language, title: `Всего заразилось в ${regionDat}`, signedValues: false,
        series: [
          { series: estimated, color: colorRed, title: language === 'ru' ? 'Оценка (по летальности)' : 'Estimated', },
          { series: estimatedForecast, color: colorRedTr, title: language === 'ru' ? 'Оценка (прогноз)' : 'Estimated (forecast)', },
          { series: confirmed, color: colorOrange, title: language === 'ru' ? 'Зарегистрировано' : "Confirmed", },
          { series: confirmedForecast, color: colorOrangeTr, title: language === 'ru' ? 'Зарегистрировано (прогноз)' : "Confirmed (forecast)", }],
      },
      chart2: {
        type: "point", dates: dates.slice(1), language, title: `Заражено ежесуточно в ${regionDat}`, signedValues: true,
        series: [
          { series: diffEstimated, color: colorRed, title: language === 'ru' ? 'Оценка за сутки' : 'Estimated/day', },
          { series: diffEstimatedForecast, color: colorRedTr, title: language === 'ru' ? 'Оценка за сутки (прогноз)' : 'Estimated/day (forecast)', },
          { series: diffConfirmed, color: colorOrange, title: language === 'ru' ? 'Зарегистрировано за сутки' : 'Confirmed/day', },
          { series: diffConfirmedForecast, color: colorOrangeTr, title: language === 'ru' ? 'Зарегистрировано за сутки (прогноз)' : 'Confirmed/day (forecast)', },
        ],
      }
    });

    rows.push({
      anchor: "deaths",
      chart1: {
        type: "line", dates, language, title: `Смертельных случаев в ${regionDat}`, signedValues: false,
        series: [
          { series: series.deaths, color: colorRed, title: language === 'ru' ? 'Летальных случаев всего' : 'Deaths confirmed' },
          { series: deathsForecast, color: colorRedTr, title: language === 'ru' ? 'Летальных случаев (прогноз)' : 'Deaths forecast' }],
      },
      chart2: {
        type: "bar", dates: dates.slice(1), language, title: `Смертей за день в ${regionDat}`, signedValues: true,
        series: [
          { series: diffDeaths, color: colorRed, title: language === 'ru' ? 'Летальных случаев за сутки' : 'Daily deaths' },
          { series: diffDeathsForecast, color: colorRedTr, title: language === 'ru' ? 'Летальных случаев за сутки (прогноз)' : 'Daily deaths (forecast)' },
        ],
      }
    });

    rows.push({
      anchor: "recovered",
      chart1: {
        type: "line", dates, language, title: `Выздоровело в ${regionDat}`, signedValues: false,
        series: [
          { series: series.recovered, color: colorGreen, title: language === 'ru' ? 'Выздоровело всего' : 'Recovered' },
          { series: recoveredForecast, color: colorGreenTr, title: language === 'ru' ? 'Выздоровело (прогноз)' : 'Recovered forecast' },
        ],
      },
      chart2: {
        type: "bar", dates: dates.slice(1), language, title: `Выздоровело за сутки в ${regionDat}`, signedValues: true,
        series: [{ series: diffRecovered, color: colorGreen, title: language === 'ru' ? 'Выздоровело за сутки' : 'Daily recoveries' },
        { series: diffRecoveredForecast, color: colorGreenTr, title: language === 'ru' ? 'Выздоровело за сутки (прогноз)' : 'Daily recoveries (forecast)' }
        ],
      }
    });

    /*
        const missed = confirmed.map((item, index) =>
          (item == null || estimated[index] === null || item === estimated[index])
            ? null : (Math.round(estimated[index] ?? 0 - item)));
    
        var missedForecast = null;
        if (forecastDays > 0) {
          missedForecast = this.getForecastData(time, missed.filter(x => x !== null).map(x => x ?? 0), forecastDays);
        }
    
        const notConfirmedChart = this.createChartData(time, [
          this.createChart("Missed cases", missed, lineColor1, true),
          this.createChart("Missed forecast", missedForecast, lineColor1f, true)
        ]);
    */

    // const annotations = result[2].map((item) => {
    //   return {
    //     drawTime: "afterDatasetsDraw",
    //     type: "line",
    //     mode: "vertical",
    //     scaleID: "x-axis-0",
    //     value: moment(item.date, 'DD.MM.YYYY').toDate(),
    //     borderColor: "#00000050",
    //     borderWidth: 1,
    //     label: {
    //       backgroundColor: "rgba(175,175,175,1)",
    //       fontStyle: "normal",
    //       cornerRadius: 3,
    //       position: "top",
    //       content: item.text,
    //       enabled: true,
    //       yAdjust: 2
    //     },
    //     // onClick: function (e: any) {
    //     //   console.log("Annotation", e.type, this);
    //     // }
    //   }
    // });

    return {
      region,
      regionDat,
      diffDeathsForecast: stateDiffDeathsForecast,
      diffConfirmedForecast: stateDiffConfirmedForecast,
      diffRecoveredForecast: stateDiffRecoveredForecast,
      diffEstimatedForecast: stateDiffEstimatedForecast,
      caseFatalityRate,
      incubationPeriod,
      chartRows: rows,
      optDeathPercent: 0,
      optOffset: 0,
      forecastDays,
      language,
    };
  }

  async handleClickAuto(event: any) {
    var caseFatalityRate = this.state.optDeathPercent;
    var incubationPeriod = this.state.optOffset;
    var forecastDays = this.state.forecastDays;
    var region = this.state.region;
    var regionDat = this.state.regionDat;
    const series = this.props.series;
    const language = this.state.language;
    this.setState({
      caseFatalityRate: this.state.optDeathPercent,
      incubationPeriod: this.state.optOffset
    });

    const state = this.getState(series, region, regionDat, caseFatalityRate, incubationPeriod, forecastDays, language, false);
    this.setState(state);
  }

  handleUpdateSlider = (name: string) => async (e: any, value: any) => {
    await this.updateValue(name, +value);
  }

  async handleUpdate(event: ChangeEvent<HTMLInputElement>) {
    await this.updateValue(event.target.id, +event.target.value);
  }

  async updateValue(name: string, value: number) {
    var language = this.props.language;
    var region = this.state.region;
    var regionDat = this.state.regionDat;
    var caseFatalityRate = this.state.caseFatalityRate;
    var incubationPeriod = this.state.incubationPeriod;
    var forecastDays = this.state.forecastDays;
    const series = this.props.series;
    switch (name) {
      case "caseFatalityRate":
        caseFatalityRate = value;
        break;
      case "forecastDays":
        forecastDays = value;
        break;
      case "incubationPeriod":
        incubationPeriod = value;
        break;
    }

    const state = this.getState(series, region, regionDat, caseFatalityRate, incubationPeriod, forecastDays, language, false);
    this.setState(state);
  }

  async updateValueStr(name: string, value: string) {
    const language = this.props.language;
    var region = this.state.region;
    var regionDat = this.state.regionDat;
    var caseFatalityRate = this.state.caseFatalityRate;
    var incubationPeriod = this.state.incubationPeriod;
    var forecastDays = this.state.forecastDays;
    const series = this.props.series;
    switch (name) {
      case "region":
      case "countrySlug":
        region = value;
        break;
      case "regionSlug":
        region = value;
        break;
    }


    const state = this.getState(series, region, regionDat, caseFatalityRate, incubationPeriod, forecastDays, language, false);
    this.setState(state);
  }

  render() {
    var isReactSnap = (navigator.userAgent === 'ReactSnap');

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
          <form>
            <div className="form-row">
              <div className="col-md-4 mb-3 px-2">
                {/* <label htmlFor="forecastDays">{this.state.forecastDays === 0 ? "Forecast off" : moment.duration(this.state.forecastDays, "days").humanize() + " forecast"} */}
                <label htmlFor="forecastDays">{this.state.forecastDays === 0 ? "Прогноз отключен" : "Прогноз на " + moment.duration(this.state.forecastDays, "days").humanize()}
                  <i className="btn btn-secondary btn-circle btn-sm ml-1" data-toggle="tooltip" data-placement="bottom" title="Number of days of forecasts"><i className="fa fa-info"></i></i>
                </label>
                <PrettoSlider
                  id="forecastDays"
                  valueLabelDisplay="auto"
                  value={typeof this.state.forecastDays === 'number' ? this.state.forecastDays : 0}
                  max={28}
                  onChange={this.handleUpdateSlider("forecastDays")}
                  aria-labelledby="input-slider" />
              </div>
              <div className="col-md-4 mb-3 px-2">
                {/* <label htmlFor="caseFatalityRate">Case Fatality Rate {this.state.caseFatalityRate}% */}
                <label htmlFor="caseFatalityRate">Летальность {this.state.caseFatalityRate}%
                <i className="btn btn-secondary btn-circle btn-sm ml-1" data-toggle="tooltip" data-placement="bottom" title="Max CFR in China is 4.16%. WHO estimates mortality rate as 2-3.4%"><i className="fa fa-info"></i></i>
                  {/* <a className="fa fa-info-circle" data-toggle="tooltip" data-placement="bottom" title="hey tooltip"></a></label> */}
                </label>
                {/* <input id="caseFatalityRate" type="number" className="form-control" step="0.1" value={this.state.caseFatalityRate} onChange={this.handleUpdate} /> */}
                <PrettoSlider
                  id="caseFatalityRate"
                  valueLabelDisplay="auto"
                  value={typeof this.state.caseFatalityRate === 'number' ? this.state.caseFatalityRate : 1}
                  min={0.3}
                  max={12}
                  step={0.1}
                  onChange={this.handleUpdateSlider("caseFatalityRate")}
                  aria-labelledby="input-slider" />
                {/* <small id="caseFatalityRateHelp" className="form-text text-muted">Max CFR in China is 4.16%. WHO estimates mortality rate as 2-3.4%</small> */}
              </div>
              <div className="col-md-4 mb-3 px-2">
                {/* <label htmlFor="incubationPeriod">Infection to Death {moment.duration(this.state.incubationPeriod, "days").humanize()} */}
                <label htmlFor="incubationPeriod">От выявления до смерти {moment.duration(this.state.incubationPeriod, "days").humanize()}
                  <i className="btn btn-secondary btn-circle btn-sm ml-1" data-toggle="tooltip" data-placement="bottom" title="Incubation period (~11.5 days) plus number of days from the occurence of the first symptom to death (median ~14 days)"><i className="fa fa-info"></i></i>
                </label>
                {/* <input id="incubationPeriod" type="number" className="form-control" value={this.state.incubationPeriod} onChange={this.handleUpdate} /> */}
                <PrettoSlider
                  id="incubationPeriod"
                  valueLabelDisplay="auto"
                  value={typeof this.state.incubationPeriod === 'number' ? this.state.incubationPeriod : 1}
                  min={0}
                  max={30}
                  step={1}
                  onChange={this.handleUpdateSlider("incubationPeriod")}
                  aria-labelledby="input-slider" />
                {/* <small id="incubationPeriodHelp" className="form-text text-muted">Incubation period (~11.5 days) plus number of days from the occurence of the first symptom to death (median ~14 days)</small> */}
              </div>

              {/* <div className="col-md-3 mb-3 align-bottom">
                <label htmlFor="autoButton">&nbsp;</label>
                { <Button id="autoButton" type="button" variant="contained" color="primary" onClick={this.handleClickAuto}>
                  Auto ({this.state.optDeathPercent}%/{this.state.optOffset} days)
                </Button> }
                <button id="autoButton" type="button" className="btn btn-secondary form-control" onClick={this.handleClickAuto}>Auto ({this.state.optDeathPercent}%/{this.state.optOffset} days)</button>
                <small id="autoButtonHelp" className="form-text text-muted">Set supposed values: {this.state.optDeathPercent}% for Case Fatality Rate and {this.state.optOffset} days for Incubation Period. These values are not necessarily optimal.</small>
              </div> */}
            </div>
          </form>
          {rows}
        </div>
      </main >
    );
  }
}

export default withRouter(RegionForecast);