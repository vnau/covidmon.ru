import React from 'react';
import numeral from 'numeral';
import 'numeral/locales/ru';
import { withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import ReactLoading from 'react-loading';
import $ from 'jquery';
import moment from 'moment';
import { Helmet } from "react-helmet";
import './css/flags.css';
import './css/flagru.css';
import './css//flag-icon.min.css';
import Chart from './Chart';
import { Props as ChartProps } from './Chart';

const apiHost = 'https://api.covidmon.ru'
//const apiHost = 'http://localhost:3000'

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
  countrySlug: string,
  regionSlug: string,
  language: string,
}

export interface State {
  countrySlug: string,
  regionSlug: string,
  searchText: string;
  regions: any[];
  series: IRegionSeries[];
  region: string;
  regionDat: string;
  iso12: string;
  iso3: string;
  language: string;
  update: Date;
  chart: ChartProps | null;
}

class Match extends React.Component<RouteComponentProps<Props>, State> {
  constructor(props: RouteComponentProps<Props>, state: State) {
    super(props);
    this.state = {
      searchText: '',
      regions: [],
      series: [],
      region: '',
      regionDat: '',
      iso12: '',
      iso3: '',
      countrySlug: '',
      regionSlug: '',
      language: props.match.params.language,
      update: new Date(),
      chart: null,
    }
  }

  redirectToTarget = (e: any, row: any, rowIndex: any) => {
  }
  async componentDidMount() {
    await this.updateData(this.props);
  }

  componentDidUpdate(prevProps: any) {
    if (this.props.location !== prevProps.location) {

    }
  }

  async componentWillReceiveProps(nextProps: any) {
    if (this.state.countrySlug !== nextProps.match.params.countrySlug
      || this.state.regionSlug !== nextProps.match.params.regionSlug) {
      await this.updateData(nextProps);
      const opt: any = { top: 0, behavior: "instant" };
      window.scrollTo(opt);
    }
  }

  public render() {
    if (!this.state.series && this.state.regions.length === 0)
      return (
        <div className="h-100 justify-content-center align-items-center text-center">
          {/* <small >получаем последние данные...</small> */}
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
            <ReactLoading type={"bars"} color={"#888888"} /></div>
        </div>
      )

    var chart = this.state.chart ? <Chart {...this.state.chart} /> : '';
    var language = this.state.language ? this.state.language : 'ru';

    numeral.locale(language);
    numeral.zeroFormat('0');

    const date = moment(this.state.update);
    var updated = date?.fromNow();

    var flag = this.state.iso12 ? <span className={"flag-icon small rounded flag-icon-" + this.state.iso12.toLowerCase()} /> : '';
    if (this.state.iso12 === 'RU' && this.state.iso3)
      flag = <span className={"flagru flagru-lg rounded flag" + this.state.iso3.toLowerCase()}></span>

    return <main>
      <Helmet htmlAttributes={{ "lang": language }}>
        <title>{`COVID-19 ${(this.state.regionDat ? "в " + this.state.regionDat : "по странам мира")}`}</title>
        <meta name="description" content={`Статистика, график и прогноз распространения коронавируса COVID-19 ${(this.state.regionDat ? "в " + this.state.regionDat : "в странах мира")}`} />
      </Helmet>

      <div className="px-3 pb-3 pb-md-4 mx-auto text-center">
        {/* <h1 className="display-4">Covid-19 Analytics in <b>{this.state.regionDat} </b>{this.state.iso12 ? <span className={"flag-icon small rounded flag-icon-" + this.state.iso12.toLowerCase()} /> : ''}</h1> */}
        <h1 className="display-4">Ситуация с COVID-19 в <b>{this.state.regionDat ? this.state.regionDat : "мире"} </b>{flag}</h1>
        {updated && <small>данные обновлены {updated}</small>}
      </div>
      {chart}

      <footer className="page-footer font-small p-4" >
        <div className="container-fluid text-center text-md-center">
          {/* <small>Data sources: CSSE at Johns Hopkins University, Rospotrebnadzor</small> */}
          <small>Источники данных: CSSE at Johns Hopkins University, Роспотребнадзор</small>
        </div>
      </footer>
    </main>
  }

  private static async fetchData(props: any): Promise<any> {
    const countrySlug = props.match.params.countrySlug;
    const regionSlug = props.match.params.regionSlug;
    const language = props.match.params.language ? props.match.params.language : 'ru';
    const rand = "?lang=" + language + "&rnd=" + (Date.now() / 60000 | 0);

    var regionDataUrl = countrySlug ? `${apiHost}/v1/countries/${countrySlug}/details` : `${apiHost}/v1/details`;

    var data = await $.ajax({ url: regionDataUrl + rand, dataType: 'json' }).then((result: any) => {
      // if (!result.region)
      //   result.region = 'мире';
      // result.region = 'the World';
      return {
        region: result.region,
        regionDat: result.regionDat ? result.regionDat : result.region,
        series: result.series,
        regions: result.regions,
        iso12: result.iso12,
        iso3: result.iso3,
        update: result.update,
        regionSlug: regionSlug,
        countrySlug: countrySlug,
        language: language,
      };
    });
    data.regions.sort((a: any, b: any) => b.stat.confirmed - a.stat.confirmed);
    //data.regions.sort((a: any, b: any) => b.stat.tests/b.population - a.stat.tests/a.population);
    const colors = ["#003f5c", "#2f4b7c",
      "#665191",
      "#a05195",
      "#d45087",
      "#f95d6a",
      "#ff7c43",
      "#ffa600",];
    var promises: any[] = [];
     //for (var i = 0; i < data.regions.length; i++) {
      for (var i = 0; i < 20; i++) {
      const slug = data.regions[i].slug;
      var request = countrySlug
        ? `${apiHost}/v1/countries/${countrySlug}/regions/${slug}/series`
        : `${apiHost}/v1/countries/${slug}/series`;
      var promise = $.ajax({ url: request, dataType: 'json' }).then((result: IRegionSeries) => {
        return result as IRegionSeries;
      });
      promises.push(promise);
    }

    for (i = 0; i < promises.length; i++) {
      const series = (await promises[i]);
      //const skipDays = series.confirmed.findIndex((v: number) => v > 1000);
      var skipDays = series.deaths.findIndex((v: number) => v > 0);
      skipDays = 0;
      series.dates = series.dates.slice(skipDays);
      series.deaths = series.deaths.slice(skipDays);
      series.confirmed = series.confirmed.slice(skipDays);
      series.cfr = series.confirmed.map((v: number, n: number) => 100 * series.deaths[n] / v);
      series.cpr = series.deaths.map((v: number, n: number) => 100000*v/data.regions[i].population);
      series.tests = series?.tests?.slice(skipDays);
      data.regions[i].series = series;
    }

    const chart = {
      type: "line", dates: data.regions[0].series.dates, language, title: `Сравнение регионов ${data.regionDat}`, signedValues: false,
      series: data.regions.filter((r: any) => r.series).map(function (r: any, i: number) {
        const ser = {
          series: r.series?.cfr,
          color: "#55555555",
          //color:getRandomColor(),
          //color: colors[7 - i],
          title: r.region
        };
        return ser;
      }),
    }
    data.chart = chart;

    return data;
  }

  private async updateData(props: any): Promise<any> {
    const state = await Match.fetchData(props);
    this.setState(state);
  }

}

export default withRouter(Match);