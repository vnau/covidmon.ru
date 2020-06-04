import React from 'react';

import '../node_modules/react-vis/dist/style.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';
import '../node_modules/font-awesome/css/font-awesome.min.css';
import { Link, RouteComponentProps, withRouter } from 'react-router-dom';
import { AsyncTypeahead, Token, TypeaheadLabelKey } from 'react-bootstrap-typeahead'
import "react-bootstrap-typeahead/css/Typeahead.css";
import "react-bootstrap-typeahead/css/Typeahead-bs4.css";
import { useHistory } from "react-router-dom";
import './css/flagru.css';
import $ from 'jquery';

interface State {
    region: string;
    slug: string;
    parentSlug: number;
    iso12: string;
    iso3: string;

    setValue: (value: State) => void;
}

type propTypes = {};
type defaultProps = {
    isLoading: boolean;
    options: State[];
    language: string;
};

function getFlag(iso12: string, iso3: string): any {
    if (iso12 && iso12 === 'RU' && iso3)
        return <span className={"flagru flagru-sm flag" + iso3.toLowerCase()} />
    else if (iso12)
        return <span className={"flag flag-" + iso12.toLowerCase()} />
    return '';
}

class Header extends React.Component<RouteComponentProps<{}> & propTypes, defaultProps> {
    state = {
        isLoading: false,
        options: [],
        language: 'ru',
    };

    render() {
        var language = this.state.language ? this.state.language : 'ru';
        const ref = React.createRef<AsyncTypeahead<State>>();

        return <main>
            <div className="App">
                <div className="d-flex flex-column flex-md-row align-items-center p-3 px-md-4 box-shadow">
                    <h5 className="my-0 mr-md-auto font-weight-normal text-uppercase">Covid-19 Pandemic Monitoring</h5>
                    <nav className="my-2 my-md-0 mr-md-3">
                        {/* <Link className='p-2 text-dark' to={{ pathname: `/countries/` }}>World</Link>
                        <Link className='p-2 text-dark' to={{ pathname: `/countries/russia/`, state: { countrySlug: 'russia', region: '', country: 'Russia' } }}>Russia</Link> */}
                        <div className="d-inline-block" style={{ minWidth: 250 }} >
                            <AsyncTypeahead
                                {...this.state}
                                id="typeahead"
                                delay={200}
                                emptyLabel="Не найдено"
                                labelKey={"region" as unknown as undefined}
                                minLength={3}
                                onSearch={this.onSearch}
                                placeholder="Поиск региона"
                                promptText="Поиск"
                                clearButton={true}
                                searchText="Поиск"
                                selectHintOnEnter={true}
                                onChange={(item: State[]) => {
                                    if (!item || item.length < 1)
                                        return;
                                    var path = item[0].parentSlug
                                        ? `/countries/${item[0].parentSlug}/regions/${item[0].slug}`
                                        : `/countries/${item[0].slug}`;
                                    if (ref && ref.current) {
                                        (ref.current as any).clear();
                                    }
                                    this.props.history.push(path);
                                }}
                                ref={ref}
                                filterBy={(option, props) => true}
                                renderMenuItemChildren={(item: State, props) => {
                                    return (
                                        <div>
                                            {getFlag(item.iso12, item.iso3)}&nbsp;
                                            <span>{item.region}</span>
                                        </div>

                                    );
                                }}
                            />
                        </div>
                        <Link className='p-2 text-dark text-nowrap' to={{ pathname: `/countries/` }}>В мире</Link>
                        <Link className='p-2 text-dark text-nowrap' to={{ pathname: `/countries/russia/`, state: { countrySlug: 'russia', region: '', country: 'Russia' } }}>В России</Link>
                    </nav>
                </div>
            </div>
        </main>
    }

    onSearch = async (query: string) => {
        const apiHost = 'https://api.covidmon.ru'
        //const apiHost = 'http://localhost:3000'
        this.setState({ isLoading: true });
        await $.ajax({ url: apiHost + `/v1/search?query=${query}&lang=${this.state.language}`, dataType: 'json' }).then((options: any) => {
            this.setState({ isLoading: false, options });
        });
    };
}

export default withRouter(Header);