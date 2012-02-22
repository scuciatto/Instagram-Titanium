// Constructor
exports.Instagram = function(options) {    
      
    /* Here we have the parameters to access the API.
     * Note that we try to load it from system parameters first
     */

    if(!options) {
        apiData = {
            client_id : '999999999999999999',
            client_secret : '99999999999999999999',
            authorize_url : 'https://instagram.com/oauth/authorize/',
            request_url : 'https://api.instagram.com/v1/',
            redirect_uri : 'http://www.xxxxx.com',
            response_type : 'token',
            scope : '',
            display : 'touch',
            access_token : Ti.App.Properties.getString('instagramAccessToken')
        }
    }

    // Interface Attributes
    var window = null;
    var winBase = null;
    var view = null;
    var webView = null;

}

/*
 * Private functions
 */


function saveToken(token) {
    Ti.App.Properties.setString('instagramAccessToken', token);
    apiData.access_token = token;
}

function hide() {
    if(!window) {
        return;
    }
    try {
        winBase.close();
        window = null;
        winBase = null;
    } catch(ex) {
        Ti.API.debug('Cannot destroy the authorize UI. Ignoring.');
    }
}


function createAuthWindow(callback) {
    closeButton = Ti.UI.createButton({
        title : 'Cancel',
        style : Ti.UI.iPhone.SystemButtonStyle.DONE
    });
    winBase = Ti.UI.createWindow({
        modal : true,
        navBarHidden : true
    });
    window = Ti.UI.createWindow({
        leftNavButton : closeButton
    });

    var navigationGroupTwitter = Ti.UI.iPhone.createNavigationGroup({
        window : window
    });

    winBase.add(navigationGroupTwitter);
    view = Ti.UI.createView({
        backgroundColor : 'white'
    });
    webView = Ti.UI.createWebView({
        url : apiData.authorize_url + '?client_id=' + apiData.client_id + '&redirect_uri=' + apiData.redirect_uri + '&response_type=token&display=touch',
        autoDetect : [Ti.UI.iOS.AUTODETECT_NONE]
    });

    webView.addEventListener('load', function(e) {
        Ti.API.info(e);
        if (e.url.indexOf('access_token=') != -1) {
            webView.stopLoading();
            saveToken(e.url.substring(e.url.indexOf('access_token=') + 13));
            hide();
            if (callback) {
                callback();
            }
        }
    });
    view.add(webView);

    closeButton.addEventListener('click', function(e) {
        Ti.App.fireEvent('app:instagram_canceled');
        hide();
    });

    window.add(view);
    winBase.open({
        modal : true,
        modalStyle : Ti.UI.iPhone.MODAL_PRESENTATION_FULLSCREEN
    });
}


/*
 * Public Functions
 */

// request the user to authorize Instagram account
exports.Instagram.prototype.authorize = function(callback) {
    if(!apiData.access_token) {
        createAuthWindow(callback);

        if(apiData.access_token) {
            Ti.App.fireEvent('app:instagram_integrated');
        } else {
            Ti.API.debug('Failed to authorize Instagram account.');
            Ti.App.fireEvent('app:instagram_failed');
        }

    }
}


// Perform a request to the API
exports.Instagram.prototype.request = function(url, method, parameters, callback) {

    var urlToSend = apiData.request_url + url + '?access_token=' + apiData.access_token;

    // adding the paramenters to the url
    var strParam = '';

    if(method === 'GET') {
        for(var key in parameters) {
            if(parameters.hasOwnProperty(key)) {
                var obj = parameters[key];
                for(var prop in obj) {
                    if(obj.hasOwnProperty(prop)) {
                        strParam += '&' + prot + '=' + obj[prop];
                    }
                }
            }
        }
        urlToSend += strParam;
    }

    var remote = Ti.Network.createHTTPClient();

    remote.onload = function() {
        callback(this.responseText);
    }

    remote.onError = function() {
        Ti.App.fireEvent("app:twitter_error");
        callback(null);
    }

    remote.open(method, urlToSend, true);
    

    if(method === 'POST') {
        remote.send(parameters)
    } else {
        remote.send();
    }
}

exports.Instagram.prototype.logout = function() {
    apiData.access_token = null;
    Ti.App.Properties.removeProperty('instagramAccessToken');
}
