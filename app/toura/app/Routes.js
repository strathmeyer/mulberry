dojo.provide('toura.app.Routes');

dojo.requireLocalization('toura', 'toura');

(function() {
  var touraRoutes = (function() {
    var routes,
        app = function() {
          var appConfig = toura.app.Config.get('app');
          app = function() { return appConfig; };
          return appConfig;
        },
        device,
        appBgImg;

    function appBackgroundImage() {
      device = device || toura.app.Config.get('device');

      if (!appBgImg) {
        appBgImg = toura.app.Config.get('app').backgroundImage;

        if (appBgImg) {
          appBgImg = appBgImg[device.type];

          appBgImg = appBgImg ? toura.app.Data.getModel(appBgImg, 'backgroundImage')[
            device.type === 'phone' ? 'gallery' : 'original'
          ] : '';
        }
      }

      return appBgImg;
    }

    function nodeRoute(route, nodeId, pageState) {
      device = device || toura.app.Config.get('device');
      pageState = pageState || {};

      var nodeModel = toura.app.Data.getModel(nodeId),
          page = toura.app.UI.currentPage,
          pf, subscription;

      if (!nodeModel) {
        console.log('Request for invalid hash', route.hash);
        toura.app.Router.home();
        return;
      }

      if (!page || !page.node || nodeId !== page.node.id) {
        // if we don't have a page yet, if we  have a page but
        // it's not a node page, or if we have a node page but
        // it's not for the requested node ... in all of these
        // cases, we need the page factory to spin up a page
        try {
          pf = toura.createPage(
            dojo.mixin(nodeModel, {
              pageBackground : nodeModel.getBackgroundImage(device) || appBackgroundImage()
            })
          );
        } catch(e) {
          console.log("Toura.app.Routes: can't create a page", e, nodeModel);

          if (nodeId !== 'node-home') {
            toura.app.Router.back();
          }

          return;
        }

        if (pf.failure) {
          if (dojo.isString(pf.failure)) {
            toura.app.PhoneGap.notification.alert(pf.failure);
          }

          toura.app.Router.back();
          return;
        }

        pf.init(pageState);
        toura.app.UI.showPage(pf, nodeModel);
      } else {
        page.init(pageState);
      }

      // record node pageview if it is node-only
      if (nodeId && !pageState.assetType) {
        dojo.publish('/node/view', [ route.hash ]);
      }

      toura.endLogSection('NODE ROUTE');

      return true;
    }

    routes = [
      {
        route : '/home',
        handler : function(params, route) {
          toura.lastSearchTerm = null;
          return nodeRoute(route, app().homeNodeId);
        },
        isDefault : true
      },

      {
        route : '/about',
        handler : function(params, route) {
          return nodeRoute(route, app().aboutNodeId);
        }
      },

      {
        route : '/maps',
        handler : function(params, route) {
          return nodeRoute(route, app().mapNodeId);
        }
      },

      {
        route : /\/node\/(.*)/,
        handler : function(params, route) {
          var splat = params.splat[0].split('/'),
              nodeId = splat[0],
              pageState = {
                assetType : splat[1],
                assetId : splat[2],
                assetSubId : splat[3]
              };

          return nodeRoute(route, nodeId, pageState);
        }
      },

      {
        route : /\/search\/?(.*)/,
        handler : function(params) {
          var page = toura.app.UI.currentPage,
              term = params.splat && params.splat[0].split('/')[0];

          page = toura.createPage({
            pageDef : 'search',
            term : term,
            getResults : dojo.hitch(toura.app.Data, 'search'),
            backgroundImage : appBackgroundImage()
          });

          toura.app.UI.showPage(page);

          return true;
        }
      },

      {
        route : '/feed/:feedId/item/:itemIndex',
        handler : function(params) {
          var feed = toura.app.Data.getModel(params.feedId, 'feed'),
              feedItem = feed.getItem(params.itemIndex),
              page = toura.createPage(dojo.mixin(feedItem, {
                pageDef : 'feed-item',
                backgroundImage : appBackgroundImage()
              }));

          toura.app.UI.showPage(page, feedItem);
        }
      }
    ];

    if (toura.features.debugPage) {
      routes.push({
        route : '/debug/:query',
        handler : function(params, route) {
          var page = toura.createPage({
            pageDef : 'debug',
            name : 'Debug',
            query : params.query,
            backgroundImage : appBackgroundImage()
          });

          toura.app.UI.showPage(page);
        }
      });
    }

    if (toura.features.favorites) {
      routes.push({
        route : '/favorites',
        handler : function() {
          var page = toura.createPage({
            name : dojo.i18n.getLocalization(
              "toura", "toura", toura.app.Config.get("locale")
            ).FAVORITES,
            pageDef : 'favorites',
            favorites : toura.app.user.Favorites.load(),
            backgroundImage : appBackgroundImage()
          });

          toura.app.UI.showPage(page);
        }
      });
    }

    return routes;
  }());

  toura.routes(touraRoutes);

}());
