import React from 'react';
import numeral from 'numeral';
import { withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import moment from 'moment';
import 'numeral/locales/ru';
import 'moment/locale/ru'
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';

interface String {
    format(...replacements: string[]): string;
}

export interface Props {
    countrySlug: string,
    regionSlug: string,
    region: string;
    regionData: any;
    regionDat: string;
    language: string;
}

interface State {
}

class RegionSummary extends React.Component<RouteComponentProps<{}> & Props, State> {
    constructor(props: RouteComponentProps<{}> & Props, state: State) {
        super(props);
        this.state = {
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
        var language = this.props.language ? this.props.language : 'ru';

        numeral.locale(language);
        numeral.nullFormat('');
        numeral.zeroFormat('');
        moment.locale(language);

        var cases = "";
        var recovered = "";
        var tests = "";
        var firstCase = "";

        if (this.props.regionData) {
            const info = this.props.regionData;
            const stat = info.stat;
            const regionsWithDead = info.regions ? info.regions.filter((r: any) => r.stat.deathsDay > 0).length : 0;
            const regionsWithDeadString = regionsWithDead > 0 ? ` в ${numeral(regionsWithDead).format()} регионах` : ``;

            cases = `По состоянию на ${moment(info.update).format('LL')} `;
            if (stat.confirmedDay) {
                cases += `в ${this.props.regionDat} выявлено ${numeral(stat.confirmedDay).format()} новых случаев заражения коронавирусной 
        инфекцией за сутки. 
        Общее количество выявленных в регионе случаев заболевания COVID-19 выросло до ${numeral(stat.confirmed).format()}.`;
            } else if (stat.confirmed) {
                cases += ` в ${this.props.regionDat} новых случаев заражения коронавирусной инфекцией за последние сутки не зафиксировано. За весь период на территории региона обнаружено ${numeral(stat.confirmed).format()} случая заболевания COVID-19.`
            }

            //recovered = `В ${this.props.regionDat} зарегистрирован ${numeral(stat.confirmed).format()} случай заболевания коронавирусом: ${numeral(stat.confirmed - stat.recovered).format()} находятся на лечении, ${numeral(stat.recovered).format()} человек выздоровели.`;
            if (stat.recovered > 0) {
                recovered = `Выздоровели от коронавируса ${numeral(stat.recovered).format()} человек`
                    + (stat.recoveredDay
                        ? `, ${numeral(stat.recoveredDay).format()} — за последние сутки.`
                        : `, за последние сутки новых выздоровлений не зафиксировано.`);
            } else if (stat.confirmed) {
                recovered = `Из ${stat.confirmed} заболевших человек пока никто не выздоровел.`;
            }


            if (stat.recovered && stat.confirmed && stat.recovered < stat.confirmed)
                recovered += ` ${numeral(stat.confirmed - stat.recovered).format()} человек находятся на лечении.`;


            if (stat.deathsDay) {
                recovered += ` ${numeral(stat.deathsDay).format()} человек за сутки скончались${regionsWithDeadString}, за весь период в ${this.props.regionDat} от коронавируса умерли ${numeral(stat.deaths).format()} человека.`;
            }

            if (stat.testsDay) {
                tests = `За сутки в ${this.props.regionDat} взято на исследование ${numeral(stat.testsDay).format('0.[00] a')} ПЦР-тестов, всего с начала тестирования проведено ${numeral(stat.tests).format('0.[00] a')} исследований.`;
            }

            if (info.series && info.series.dates && info.series.dates.length > 0) {
                const startDate = moment(info.series.dates[0]);
                firstCase = `Первый случай заражения коронавирусом в ${this.props.regionDat} был зарегистрирован ${startDate.fromNow()}, ${startDate.format('LL')}`;
            }
        }
        return <main>
            <p>{cases}</p>
            <p>{recovered}</p>
            <p>{tests}</p>
            <p>{firstCase}</p>
        </main>
    }
}

export default withRouter(RegionSummary);