import React from 'react';
import numeral from 'numeral';
import 'numeral/locales/ru';
import { Doughnut } from 'react-chartjs-2';
import { withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import RegionsTable from './RegionsTable';
import RegionCharts from './RegionCharts';
import RegionForecast from './RegionForecast';
import RegionSummary from './RegionSummary';
import ReactLoading from 'react-loading';
import $ from 'jquery';
import moment from 'moment';
import { Helmet } from "react-helmet";
import './css/flags.css';
import './css/flagru.css';
import './css//flag-icon.min.css';
import LazyLoad from 'react-lazyload';
import { Modal, Container } from "react-bootstrap";

const apiHost = 'https://api.covidmon.ru'
//const apiHost = 'http://localhost:3000'

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
  series: any;
  region: string;
  regionDat: string;
  iso12: string;
  iso3: string;
  regionData: any;
  language: string;
  modalContent: JSX.Element | null;
  modalTitle: string;
}

class Region extends React.Component<RouteComponentProps<Props>, State> {
  constructor(props: RouteComponentProps<Props>, state: State) {
    super(props);
    this.state = {
      searchText: '',
      regions: [],
      series: null,
      region: '',
      regionDat: '',
      iso12: '',
      iso3: '',
      regionData: null,
      countrySlug: '',
      regionSlug: '',
      language: props.match.params.language,
      modalContent: null,
      modalTitle: '',
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

  showModal = (title: string, content: JSX.Element) => {
    this.setState({
      modalTitle: title,
      modalContent: content,
    });
  }

  hideModal = () => {
    this.setState({
      modalTitle: '',
      modalContent: null,
    });
  }

  public render() {
    if (!this.state.regionData && this.state.regions.length === 0)
      return (
        <div className="h-100 justify-content-center align-items-center text-center">
          {/* <small >получаем последние данные...</small> */}
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
            <ReactLoading type={"bars"} color={"#888888"} /></div>
        </div>
      )

    var countrySlug = this.state.countrySlug;
    var regionSlug = this.state.regionSlug;
    var language = this.state.language ? this.state.language : 'ru';
    var series = this.state.series;

    numeral.locale(language);
    numeral.zeroFormat('0');

    var tableParams = {
      countrySlug: countrySlug,
      regionSlug: regionSlug,
      regions: this.state.regions,
      region: this.state.region,
      regionDat: this.state.regionDat,
      language: language,
    }

    var chartsParams = {
      countrySlug: countrySlug,
      regionSlug: regionSlug,
      series: series,
      regionData: this.state.regionData,
      region: this.state.region,
      regionDat: this.state.regionDat,
      language: language,
      onShowModal: this.showModal,
    }

    var chartsDiv = <div></div>
    var forecastDiv = <div></div>
    var tableDiv = <div></div>
    var statDiv = <div></div>
    var summaryDiv = <div></div>
    var formatValueDelta = (value: any) => value == null || value === undefined ? "Н/Д" : numeral(value).format('+0.[0] a');
    var formatValue = (value: any) => value == null || value === undefined ? "Н/Д" : numeral(value).format('0.[0] a');

    const testsCard = this.state.regionData?.stat?.tests
      ? <a className="card-stat card bg-primary text-white m-2" href="#tests" title={`Смотреть график количества проведённых тестов на коронавирусную инфекцию в ${this.state.regionDat}`}>
        <div className="card-body">
          <div className="cases-new small text-white text-right">{formatValueDelta(this.state.regionData?.stat?.testsDay)}</div>
          <h3 className="mb-0 text-center">{formatValue(this.state.regionData?.stat?.tests)}</h3>
        </div>
        <div className="card-footer px-2 py-1 d-flex align-items-center justify-content-between">
          <i className="fa fa-bar-chart"></i>
          <div className="small text-white">проведено тестов</div>
        </div>
      </a>
      : <div></div>

    const criticalCard = this.state.regionData?.stat?.critical
      ? <a className="card-stat card bg-warning-danger text-white m-2" href="#sick" title={`Смотреть график количества тяжёлых больных в ${this.state.regionDat}`}>
        <div className="card-body">
          <div className="cases-new small text-white text-right">{formatValueDelta(this.state.regionData?.stat?.criticalDay)}</div>
          <h3 className="mb-0 text-center">{formatValue(this.state.regionData?.stat?.critical)}</h3>
        </div>
        <div className="card-footer px-2 py-1 d-flex align-items-center justify-content-between">
          <i className="fa fa-bar-chart"></i>
          <div className="small text-white">тяжёлых</div>
        </div>
      </a>
      : <div></div>

    if (this.state.regionData && this.state.regionData.stat && this.state.regionData.stat.confirmed) {
      statDiv = <div className="row d-flex justify-content-center">
        {/* <div className="" style={{ width: "100px" }}>
          <Doughnut data={{
            datasets: [
              {
                data: [
                  this.state.regionData?.stat?.deathsDay,
                  this.state.regionData?.stat?.recoveredDay,
                  this.state.regionData?.stat?.confirmedDay,
                ],
                backgroundColor: [
                  "#dc3545", // red
                  "#28a745", //green
                  "#ffc107", // orange
                ],
                label: 'Doughnut 1',
              }],
            labels: ['Умерло', 'Выздоровело', 'Случаев']
          }} height={100} width={100} options={{
            responsive: true,
            animation: {
              animateScale: true,
              animateRotate: true
            }, legend: {
              display: false,
            }, tooltips: {
              callbacks: {
                label: function (item: any, data: any) {
                  return data.labels[item.index] + ": " + numeral(data.datasets[item.datasetIndex].data[item.index]).format('0 a');
                }
              }
            }
          }} />
        </div> */}
        {testsCard}
        <a className="card-stat card bg-warning-dark text-white m-2" href="#cases" title={`Смотреть график и прогноз количества обнаруженных больных Covid-19 в ${this.state.regionDat}`}>
          <div className="card-body">
            <div className="cases-new small text-white text-right">{formatValueDelta(this.state.regionData?.stat?.confirmedDay)}</div>
            <h3 className="mb-0 text-center">{formatValue(this.state.regionData?.stat?.confirmed)}</h3>
          </div>
          <div className="card-footer px-2 py-1 d-flex align-items-center justify-content-between">
            <i className="fa fa-bar-chart"></i>
            <div className="small text-white">всего случаев</div>
          </div>
        </a>
        <a className="card-stat card bg-warning text-white m-2" href="#sick" title={`Смотреть график и прогноз количества больных Covid-19 в ${this.state.regionDat}`}>
          <div className="card-body">
            <div className="cases-new small text-white text-right">{formatValueDelta(this.state.regionData?.stat?.confirmedDay - this.state.regionData?.stat?.recoveredDay - this.state.regionData?.stat?.deathsDay)}</div>
            <h3 className="mb-0 text-center">{formatValue(this.state.regionData?.stat?.confirmed - this.state.regionData?.stat?.recovered - this.state.regionData?.stat?.deaths)}</h3>
          </div>
          <div className="card-footer px-2 py-1 d-flex align-items-center justify-content-between">
            <i className="fa fa-bar-chart"></i>
            <div className="small text-white">болеет</div>
          </div>
        </a>

        <div className="m-2" style={{ width: "80px", height: "60px" }}>
          <Doughnut data={{
            datasets: [
              /* Outer doughnut data starts*/
              {
                data: [
                  this.state.regionData?.stat?.recovered,
                  this.state.regionData?.stat?.confirmed - this.state.regionData?.stat?.deaths - this.state.regionData?.stat?.recovered,
                  this.state.regionData?.stat?.deaths,
                ],
                backgroundColor: [
                  "#28a745", //green
                  "#ffc107", // orange
                  "#dc3545", // red
                ],
                borderColor: [
                ],
                borderAlign: "inner",
                label: 'Doughnut 1',
              }],
            labels: ['Выздоровело', 'Болеют', 'Погибло']
          }} height={100} width={100} options={{
            elements: {
              arc: {
                borderWidth: 1
              }
            },
            responsive: true,
            animation: {
              animateScale: true,
              animateRotate: true
            }, legend: {
              display: false,
            }, tooltips: {
              callbacks: {
                label: function (item: any, data: any) {
                  //return data.labels[item.index] +" "+ numeral(data.datasets[item.datasetIndex].data[item.index]).format('0 a');
                  return numeral(data.datasets[item.datasetIndex].data[item.index]).format('0 a');
                }
              }
            }
          }} />
        </div>
        <a className="card-stat card bg-success text-white m-2" href="#cases" title={`Смотреть график и прогноз количества выздоровевших от Covid-19 в ${this.state.regionDat}`}>
          <div className="card-body">
            <div className="cases-new small text-white text-right">{formatValueDelta(this.state.regionData?.stat?.recoveredDay)}</div>
            <h3 className="mb-0 text-center">{formatValue(this.state.regionData?.stat?.recovered)}</h3>
          </div>
          <div className="card-footer px-2 py-1 d-flex align-items-center justify-content-between">
            <i className="fa fa-bar-chart"></i>
            <div className="small text-white">выздоровело</div>
          </div>
        </a>
        {criticalCard}
        <a className="card-stat card bg-danger text-white m-2" href="#cases" title={`Смотреть график и прогноз количества умерших от коронавируса в ${this.state.regionDat}`}>
          <div className="card-body text-center">
            <div className="cases-new small text-white text-right">{formatValueDelta(this.state.regionData?.stat?.deathsDay)}</div>
            <h3 className="mb-0">{formatValue(this.state.regionData?.stat?.deaths)}</h3>
          </div>
          <div className="card-footer px-2 py-1 d-flex align-items-center justify-content-between">
            <i className="fa fa-bar-chart"></i>
            <div className="small text-white">погибло</div>
          </div>
        </a>
      </div>
    };

    if (series) {
      chartsDiv =
        <div>
          <h3 className="text-center">Динамика распространения коронавируса{this.state.regionDat
            ? " в " + this.state.regionDat
            : " в мире"}</h3>
          <RegionCharts {...chartsParams} />
        </div>
    };

    if (series) {
      forecastDiv = <LazyLoad height={1262} offset={100}>
        <div>
          <h3 className="text-center">Аналитика и прогноз{this.state.region
            ? ", " + this.state.region
            : " в мире"}</h3>
          <RegionForecast {...chartsParams} />
        </div>
      </LazyLoad>
    };

    if (this.state.regions) {
      tableDiv =
        <div>
          <h3 className="text-center">{this.state.regionDat
            ? "Данные по регионам " + this.state.regionDat
            : "Состояние по странам мира"}</h3>
          <RegionsTable {...tableParams} />
        </div>
    }

    if (this.state.region) {
      summaryDiv = <div>
        <h3 className="text-center">{this.state.regionDat
          ? "Сводка по обстановке в " + this.state.regionDat
          : "Сводка по COVID-19"}</h3>
        <RegionSummary {...chartsParams} />
      </div>
    }

    const date = this.state.regionData ? moment(this.state.regionData?.update) : null;
    var updated = date?.fromNow();

    var flag = this.state.iso12 ? <span className={"flag-icon small rounded flag-icon-" + this.state.iso12.toLowerCase()} /> : '';
    if (this.state.iso12 === 'RU' && this.state.iso3)
      flag = <span className={"flagru flagru-lg rounded flag" + this.state.iso3.toLowerCase()}></span>

    return <main>
      <Container>
        <Helmet htmlAttributes={{ "lang": language }}>
          <title>{`COVID-19 ${(this.state.regionDat ? "в " + this.state.regionDat : "по странам мира")}`}</title>
          <meta name="description" content={`Статистика, график и прогноз распространения коронавируса COVID-19 ${(this.state.regionDat ? "в " + this.state.regionDat : "в странах мира")}`} />
        </Helmet>

        <div className="px-3 pb-3 pb-md-4 mx-auto text-center">
          {/* <h1 className="display-4">Covid-19 Analytics in <b>{this.state.regionDat} </b>{this.state.iso12 ? <span className={"flag-icon small rounded flag-icon-" + this.state.iso12.toLowerCase()} /> : ''}</h1> */}
          <h1 className="display-4">Ситуация с COVID-19 в <b>{this.state.regionDat ? this.state.regionDat : "мире"} </b>{flag}</h1>
          {updated && <small>данные обновлены {updated}</small>}
        </div>

        {statDiv}
        {chartsDiv}

        {tableDiv}
        {forecastDiv}
        {summaryDiv}

        <footer className="page-footer font-small p-4" >
          <div className="container-fluid text-center text-md-center">
            {/* <small>Data sources: CSSE at Johns Hopkins University, Rospotrebnadzor</small> */}
            <small>Источники данных: CSSE at Johns Hopkins University, Роспотребнадзор</small>
          </div>
        </footer>

        {/* Popup modal */}
        <Modal size="lg" show={this.state.modalContent != null} onHide={() => this.hideModal()}>
          <Modal.Header className='bg-light pb-2 text-secondary' closeButton>
            <p className='text-center w-100' style={{ fontSize: '0.8em' }}>{this.state.modalTitle}</p>
          </Modal.Header>
          {this.state.modalContent}
        </Modal>
      </Container>
    </main>
  }

  private static async fetchData(props: any): Promise<any> {
    const countrySlug = props.match.params.countrySlug;
    const regionSlug = props.match.params.regionSlug;
    const language = props.match.params.language ? props.match.params.language : 'ru';
    const rand = "?lang=" + language + "&rnd=" + (Date.now() / 60000 | 0);

    var regionDataUrl;
    if (!countrySlug) { // world
      regionDataUrl = apiHost + "/v1/details";
    } else // region
      if (regionSlug) {
        regionDataUrl = apiHost + "/v1/countries/" + countrySlug + "/regions/" + regionSlug + '/details';
      } else { // country
        regionDataUrl = apiHost + "/v1/countries/" + countrySlug + '/details';
      }

    return await $.ajax({ url: regionDataUrl + rand, dataType: 'json' }).then((result: any) => {
      return {
        region: result.region,
        regionDat: result.regionDat ? result.regionDat : result.region,
        series: result.series,
        regions: result.regions,
        iso12: result.iso12,
        iso3: result.iso3,
        regionData: result,
        regionSlug: regionSlug,
        countrySlug: countrySlug,
        language: language,
      };
    });
  }

  private async updateData(props: any): Promise<any> {
    const state = await Region.fetchData(props);
    this.setState(state);
  }

}

export default withRouter(Region);