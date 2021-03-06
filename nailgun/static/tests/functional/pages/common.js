/*
 * Copyright 2015 Mirantis, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 **/

define([
    'underscore',
    'intern/chai!assert',
    '../../helpers',
    'tests/functional/pages/login',
    'tests/functional/pages/welcome',
    'tests/functional/pages/cluster',
    'tests/functional/pages/clusters'
],
    function(_, assert, Helpers, LoginPage, WelcomePage, ClusterPage, ClustersPage) {
    'use strict';
        function CommonMethods(remote) {
            this.remote = remote;
            this.loginPage = new LoginPage(remote);
            this.welcomePage = new WelcomePage(remote);
            this.clusterPage = new ClusterPage(remote);
            this.clustersPage = new ClustersPage(remote);
        }

        CommonMethods.prototype = {
            constructor: CommonMethods,
            pickRandomName: function(prefix) {
                return (prefix || 'Item') + ' #' + _.random(1000, 9999);
            },
            getOut: function() {
                var self = this;
                return this.remote
                    .then(function() {
                        return self.welcomePage.skip();
                    })
                    .then(function() {
                        return self.loginPage.logout();
                    });
            },
            getIn: function() {
                var self = this;
                return this.remote
                    .then(function() {
                        return self.loginPage.logout();
                    })
                    .then(function() {
                        return self.loginPage.login();
                    })
                    .waitForElementDeletion('.login-btn', 2000)
                    .then(function() {
                        return self.welcomePage.skip();
                    })
                    .waitForCssSelector('.navbar-nav', 1000);
            },
            createCluster: function(clusterName, stepsMethods) {
                var self = this;
                return this.remote
                    .clickLinkByText('Environments')
                    .waitForCssSelector('.clusters-page', 2000)
                    .then(function() {
                        return self.clustersPage.createCluster(clusterName, stepsMethods);
                    });
            },
            removeCluster: function(clusterName, suppressErrors) {
                var self = this;
                return this.remote
                    .clickLinkByText('Environments')
                    .waitForCssSelector('.clusters-page', 2000)
                    .then(function() {
                        return self.clustersPage.goToEnvironment(clusterName);
                    })
                    .then(function() {
                        return self.clusterPage.removeCluster(clusterName);
                    })
                    .catch(function() {
                        if (!suppressErrors) throw new Error('Unable to delete cluster ' + clusterName);
                    });
            },
            doesClusterExist: function(clusterName) {
                var self = this;
                return this.remote
                    .clickLinkByText('Environments')
                    .waitForCssSelector('.clusters-page', 2000)
                    .findAllByCssSelector(self.clustersPage.clusterSelector)
                        .then(function(divs) {
                            return divs.reduce(function(matchFound, element) {
                                return element.getVisibleText().then(
                                    function(name) {
                                        return (name === clusterName) || matchFound;
                                    }
                                )}, false);
                        });
            },
            addNodesToCluster: function(nodesAmount, nodesRoles, nodeStatus, nodeNameFilter) {
                var self = this;
                return this.remote
                    .then(function() {
                        return self.clusterPage.goToTab('Nodes');
                    })
                    .waitForCssSelector('button.btn-add-nodes', 1000)
                    .clickByCssSelector('button.btn-add-nodes')
                    .waitForCssSelector('.node', 2000)
                    .then(function() {
                        if (nodeNameFilter) return self.clusterPage.searchForNode(nodeNameFilter);
                    })
                    .then(function() {
                        return self.clusterPage.checkNodeRoles(nodesRoles);
                    })
                    .then(function() {
                        return self.clusterPage.checkNodes(nodesAmount, nodeStatus);
                    })
                    .clickByCssSelector('.btn-apply')
                    .waitForElementDeletion('.btn-apply', 2000);
            }
        };
        return CommonMethods;
});
