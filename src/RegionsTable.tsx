import React from 'react';
import numeral from 'numeral';
import { Link, withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import BootstrapTable, { SortOrder } from 'react-bootstrap-table-next';
import ToolkitProvider from 'react-bootstrap-table2-toolkit';
import moment from 'moment';
import 'numeral/locales/ru';
import 'moment/locale/ru'
import './css/flagru.css';
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import { TableContainer } from '@material-ui/core';

export interface Props {
  countrySlug: string,
  regionSlug: string,
  regions: any;
  region: string;
  regionDat: string;
  language: string;
}

interface State {
  countrySlug: string,
  regionSlug: string,
  regions: any[];
  region: string;
  regionDat: string;
  language: string;
}

class RegionsTable extends React.Component<RouteComponentProps<{}> & Props, State> {
  constructor(props: RouteComponentProps<{}> & Props, state: State) {
    super(props);
    this.state = {
      countrySlug: props.countrySlug,
      regionSlug: props.regionSlug,
      regions: props.regions,
      region: props.region,
      regionDat: props.regionDat,
      language: props.language,
    }
  }

  redirectToTarget = (e: any, row: any, rowIndex: any) => {
  }

  async componentDidMount() {
  }

  async componentWillReceiveProps(nextProps: any) {
    this.setState(nextProps);
  }

  public render() {
    if (!this.state.regions || this.state.regions?.length === 0) {
      return <main></main>
    }
    var countrySlug = this.state.countrySlug;
    var language = this.state.language ? this.state.language : 'ru';

    numeral.locale(language);
    numeral.nullFormat('');
    numeral.zeroFormat('');
    moment.locale(language);

    function formatterRegion(cell: any, row: any) {
      return (
        <Link to={{
          pathname: `/countries/` + (countrySlug ? countrySlug + '/regions/' : '') + row.slug + '/',
        }}>{row.region}</Link>
      );
    }

    function formatterNumber(cell: any, row: any) {
      return (<div>{cell ? Math.round(cell).toLocaleString() : ''}</div>);
    }

    function formatWithBadge(cell: any, row: any, cls: string, plus: boolean) {
      if (cell)
        return (<span className={"badge badge-" + cls}>{((cell > 0 && plus) ? '+' : '') + cell}</span>);
      else
        return <div></div>
    }

    function formatWithBadgeCond(cell: any) {
      if (cell)
      {
        var cls = cell>1 ? 'danger' : (cell>0.8? 'warning-danger': cell>0.5?'warning':'success');
        return (<span className={"badge badge-" + cls}>{numeral(cell).format('0.[00] a')}</span>);
      }
      else
        return <div></div>
    }

    function getFlag(iso12:string, iso3:string): any {
      if (iso12 && iso12==='RU' && iso3)
        return <span className={"flagru flagru-sm flag" + iso3.toLowerCase()} />
      else if (iso12)
        return <span className={"flag flag-" + iso12.toLowerCase()} />
      return '';
    }

    const columns = [{
      dataField: 'slug',
      text: 'Slug',
      isKey: true,
      hidden: true,
    }, {
      dataField: 'population',
      text: 'Population',
      hidden: true,
    }, {
      dataField: 'any',
      formatter: (cell: any, row: any, index: any) => <div>{index + 1}.</div>,
      text: 'N'
    }, {
      dataField: 'iso12',
      text: '',
      formatter: (cell:string ,row:any)=>getFlag(cell, row.iso3),
      sort: false,

    }, {
      dataField: 'region',
      text: 'Страна, регион',
      row: 2,
      colSpan: 11,
      formatter: formatterRegion,
      sort: true,

    }, {
      dataField: 'stat.confirmed',
      // text: 'Total Cases',
      text: 'Случаев\n',
      formatter: formatterNumber,
      sort: true
    }, {
      dataField: 'percent',
      text: 'Случаев\n%нас',
      formatter: (cell: any) => cell ? cell + '%' : '',
      sort: true
    }, {
      dataField: 'stat.confirmedDay',
      // text: 'New Cases',
      text: 'Случаев/\nдень',
      formatter: (cell: any) => formatWithBadge(cell, null, "warning", true),
      sort: true
    }, {
      dataField: 'stat.spread',
      // text: 'Doubled in',
      text: 'Расп.\nK',
      formatter: (cell: any) => formatWithBadgeCond(cell),
      sort: true
    }, {
      dataField: 'stat.doubled',
      // text: 'Doubled in',
      text: 'Удвоение\nза',
      formatter: (cell: any) => <div>{cell ? moment.duration(cell, "days").humanize() : ''}</div>,
      sort: true
    }, {
      dataField: 'stat.deaths',
      // text: 'Total Deaths',
      text: 'Умерло\n',
      formatter: formatterNumber,
      sort: true
    }, {
      dataField: 'stat.deathsDay',
      // text: 'New Deaths',
      text: 'Умерло/\nдень',
      formatter: (cell: any) => formatWithBadge(cell, null, "danger", true),
      sort: true
    }, {
      dataField: 'deathsPop',
      // text: 'Deaths/1M Pop',
      text: 'Умерло/\n1млн',
      formatter: (cell: any) => (cell) ? numeral(Math.round(cell)).format('0.[0] a') : '',
      sort: true
    }, {
      dataField: 'stat.recovered',
      // text: 'Total Recovered',
      text: 'Выздоров.\n',
      formatter: (cell: any) => formatWithBadge(cell, null, "success", false),
      sort: true
    }, {
      dataField: 'cfr',
      // text: 'CFR',
      text: 'Летальн.\n',
      formatter: (cell: any) => cell ? numeral(cell).format('0.[0]%') : '',
      sort: true
    }, {
      dataField: 'stat.tests',
      // text: 'Total Tests',
      text: 'Тестов\n',
      formatter: (cell: any) => cell ? numeral(cell).format('0,0.[0]') : '',
      sort: true
    }, {
      dataField: 'testsPop',
      // text: 'Total Tests',
      text: 'Тестов/\n100т',
      formatter: (cell: any) => (cell) ? numeral(Math.round(cell)).format('0,0.[0]') : '',
      sort: true
    }, {
      dataField: 'testsPerCase',
      // text: 'Total Tests',
      text: 'Тестов/\nслуч.',
      formatter: (cell: any) => (cell) ? numeral(Math.round(cell)).format('0.[0]') : '',
      sort: true
    }];

    const defaultSorted: [any] = [{
      dataField: 'stat.confirmed',
      order: "desc" as SortOrder
    }];

    const rowEvents = {
      onClick: this.redirectToTarget
    };

    const countries = this.state.regions;
    for (var i = 0; i < countries.length; i++) {
      countries[i].percent = (countries[i].population && countries[i].stat) ? Math.round(10000 * countries[i].stat.confirmed / countries[i].population) / 100 : undefined;
      countries[i].testsPop = (countries[i].population && countries[i]?.stat?.tests) ? 100000 * countries[i].stat.tests / countries[i].population : undefined;
      countries[i].deathsPop = (countries[i].population && countries[i]?.stat?.deaths) ? 1000000 * countries[i].stat.deaths / countries[i].population : undefined;
      countries[i].testsPerCase = (countries[i]?.stat?.confirmed && countries[i]?.stat?.tests) ? countries[i].stat.tests / countries[i].stat.confirmed : undefined;
      countries[i].cfr = (countries[i]?.stat?.deaths && countries[i]?.stat?.recovered) ? countries[i].stat.deaths / (countries[i].stat.deaths + countries[i].stat.recovered) : undefined;
    }

    return <main>
      {/* <h3 className="text-center">Regions of {this.state.region}</h3> */}
      <ToolkitProvider
        keyField='slug'
        data={countries}
        columns={columns}
        search>
        {
          props => (
            <div>
              {/* <SearchBar {...props.searchProps}   /> */}
              <BootstrapTable
                //      rowEvents={rowEvents}
                //pagination={paginationFactory({})}
                bootstrap4
                hover
                condensed
                bordered={false}
                classes='table-sm table-reponsive-sm'
                defaultSorted={defaultSorted}

                {...props.baseProps}
              >
                {/* <TableHeaderColumn></TableHeaderColumn> */}
              </BootstrapTable>
            </div>)
        }
      </ToolkitProvider>
    </main>
  }
}

export default withRouter(RegionsTable);