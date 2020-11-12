import React from 'react';
import { Switch, Route } from 'react-router-dom'
import Region from './Region';
import Match from './Match';

class Main extends React.Component {
    render() {
        return <main>
            <div className="container App">
                <Switch>
                    <Route exact path='/' component={Region} />
                    <Route path='/match' component={Match} />
                    <Route path='/countries/:countrySlug/match' component={Match} />
                    <Route path='/countries/:countrySlug/regions/:regionSlug' component={Region} />
                    <Route path='/countries/:countrySlug' component={Region} />
                    <Route path='/countries' component={Region} />
                    {/* <Route exact path='/:language' component={Regions} />
                <Route exact path='/:language/countries' component={Regions} />
                <Route path='/:language/countries/:countrySlug/regions/:regionSlug' component={Regions} />
                <Route path='/:language/countries/:countrySlug' component={Regions} /> */}
                </Switch>
            </div>
        </main>
    }
}

export default Main;
