var pixelPerfect = pixelPerfect || {};

if (typeof pixelPerfect.panelActions == "undefined") {
    pixelPerfect.panelActions = {};
}

pixelPerfect.panelActions = (function(){
    // private
    var documents = undefined,
        opacity = 0.5,
        overlayDivId = 'pp_overlay',
        overlayLocked = false;
        
    var self = this;
    
    function getDocuments () {
		if(documents === undefined) {
			mainDocument = window.content.document;
			
			var ppPanel = Firebug.currentContext.getPanel("pixelPerfect");
			panelDocument = ppPanel.document;
			documents = {main: mainDocument, panel: panelDocument};
		}
		return documents;
	}
    
    // public
    return {
        getPrefValue: function(name){
        
            const PrefService = Components.classes["@mozilla.org/preferences-service;1"];
            const nsIPrefBranch = Components.interfaces.nsIPrefBranch;
            const nsIPrefBranch2 = Components.interfaces.nsIPrefBranch2;
            const prefs = PrefService.getService(nsIPrefBranch2);
            const prefDomain = "extensions.firebug";
            
            //Check if this is global firefox preference.
            var prefName;
            if (name.indexOf("browser.") != -1) 
                prefName = name;
            else 
                prefName = prefDomain + "." + name;
            
            var type = prefs.getPrefType(prefName);
            
            if (type == nsIPrefBranch.PREF_STRING) {
                return prefs.getCharPref(prefName);
            }
            else {
                if (type == nsIPrefBranch.PREF_INT) {
                    return prefs.getIntPref(prefName);
                }
                else {
                    if (type == nsIPrefBranch.PREF_BOOL) {
                        return prefs.getBoolPref(prefName);
                    }
               }
           }
        },
        
        setPrefValue: function(name, value){
            const PrefService = Components.classes["@mozilla.org/preferences-service;1"];
            const nsIPrefBranch = Components.interfaces.nsIPrefBranch;
            const nsIPrefBranch2 = Components.interfaces.nsIPrefBranch2;
            const prefs = PrefService.getService(nsIPrefBranch2);
            const prefDomain = "extensions.firebug";
            
            //Check if this is global firefox preference.
            var prefName;
            if (name.indexOf("browser.") != -1) 
                prefName = name;
            else {
                prefName = prefDomain + "." + name;
            }
            
            var type = prefs.getPrefType(prefName);
            if (type == nsIPrefBranch.PREF_STRING) {
                prefs.setCharPref(prefName, value);
            }
            else {
                if (type == nsIPrefBranch.PREF_INT) {
                    prefs.setIntPref(prefName, value);
                } 
                else {
                    if (type == nsIPrefBranch.PREF_BOOL) {
                        prefs.setBoolPref(prefName, value);
                    }
                    else { 
                        if (type == nsIPrefBranch.PREF_INVALID) {
                            throw "Invalid preference: " + prefName;
                        }
                    }
                }
            }
        },
        
        // Wrapper for getting preferences with a default.
        // Returns undefined if the preference doesn't exist and no default is specified.
        getPref: function(name, defaultval){
            var val = this.getPrefValue(name);
            return ("undefined" == typeof(val) ? defaultval : val);
        },
        
        toggleOverlay: function(overlayIconDocumentId, overlayUrl) {
        	var mainDocument = getDocuments().main,
        		panelDocument = getDocuments().panel,
                pixelperfect = mainDocument.getElementById(overlayDivId),
                overlayIconEle = panelDocument.getElementById(overlayIconDocumentId),
                pageBody = mainDocument.getElementsByTagName("body")[0],
                overlayUrlNoSpaces = overlayUrl.replace(/\s/g, "%20"),
                chromeToOverlayUrl = 'chrome://pixelperfect/content/user_overlays/' + overlayUrl,
                chromeToOverlayUrlNoSpaces = 'chrome://pixelperfect/content/user_overlays/' + overlayUrlNoSpaces;
            
            
            if (pixelperfect == null) {
                this.turnOnOverlay(chromeToOverlayUrl, chromeToOverlayUrlNoSpaces, pageBody, overlayUrl);
                overlayIconEle.setAttribute("class", "overlay-active");
            }
            else {
                // hide overlay
                this.setPrefValue("pixelPerfect.lastXPos", this.findPixelPerfectXPos(overlayDivId));
                this.setPrefValue("pixelPerfect.lastYPos", this.findPixelPerfectYPos(overlayDivId));
                pageBody.removeChild(pixelperfect);
                this.setPrefValue("pixelPerfect.lastOverlayFileName", '');
                
                var currentOverlayBackgroundUrl = pixelperfect.style.background;
                
                
                // user has clicked on a different overlay
                if (currentOverlayBackgroundUrl.indexOf(overlayUrlNoSpaces) == -1) {
                    this.setPrefValue("pixelPerfect.lastXPos", '0');
                    this.setPrefValue("pixelPerfect.lastYPos", '0');
                    this.setPrefValue("pixelPerfect.opacity", '0.5');
                    this.setPrefValue("pixelPerfect.zIndex", '1000');
                    this.setPrefValue("pixelPerfect.overlayLocked", false);

                    this.resetOverlayIconsActiveState();
                    overlayIconEle.setAttribute("class", "overlay-active");

                    // turn on new overlay
                    this.turnOnOverlay(chromeToOverlayUrl, chromeToOverlayUrlNoSpaces, pageBody, overlayUrl);
                }

                else {
                    overlayIconEle.setAttribute("class", "");
                }
            }
        },

        resetOverlayIconsActiveState: function() {
            var overlayList = getDocuments().panel.getElementById('overlay-list'),
                overlayIcons = overlayList.getElementsByTagName("img");
            
            for(var i = 0, overlayIcon; overlayIcon = overlayIcons[i]; i++) {
                overlayIcon.setAttribute("class", "");
            }
        },
        
        turnOnOverlay: function(chromeToOverlayUrl, chromeToOverlayUrlNoSpaces, pageBody, overlayUrl){

            var mainDocument = getDocuments().main,
            	panelDocument = getDocuments().panel;
            var divPixelPerfect = mainDocument.createElement("div");
            divPixelPerfect.setAttribute("id", overlayDivId);
            
            // updateZIndex from pref
            // var zIndexTextInputEle = panelDocument.getElementById('z-index-input');
            // var savedZIndex = this.getPref("pixelPerfect.zIndex");
            // zIndexTextInputEle.value = savedZIndex;

            imageDimensions = this.getImageDimensions(chromeToOverlayUrl);
            var width = imageDimensions[0];
            var height = imageDimensions[1];
            divPixelPerfect.setAttribute("style", "z-index: 10000");
            divPixelPerfect.style.background = 'url(' + chromeToOverlayUrlNoSpaces + ') no-repeat';
            divPixelPerfect.style.width = width;
            divPixelPerfect.style.height = height;

            divPixelPerfect.style.opacity = opacity;
            divPixelPerfect.style.MozOpacity = opacity;
            divPixelPerfect.style.position = 'absolute';
            divPixelPerfect.style.top = this.getPref("pixelPerfect.lastYPos") + 'px';
            divPixelPerfect.style.left = this.getPref("pixelPerfect.lastXPos") + 'px';
			divPixelPerfect.style.cursor = 'all-scroll';
            
            var draggableScriptId = "draggable-script";
            
            var existingDraggableScript = mainDocument.getElementById(draggableScriptId);
            this.removeChildElement(existingDraggableScript, pageBody);
            pageBody.appendChild(divPixelPerfect);
			
            // update overlayLocked Attribute from pref
            var overlayLockedChkEle = panelDocument.getElementById('position-lock-chk');
            overlayLocked = this.getPref("pixelPerfect.overlayLocked");
            this.updateDragStatus();
            this.togglePointerEvents();
            overlayLockedChkEle.checked = overlayLocked;
            
            // opacity
            var savedOpacity = this.getPref("pixelPerfect.opacity");
            opacity = this.roundNumber(savedOpacity, 1);
            //this.updateOverlayOpacity();
            
            var draggablePP = mainDocument.createElement("script");
            draggablePP.setAttribute("type", "text/javascript");
            draggablePP.setAttribute("id", draggableScriptId);
            draggablePP.innerHTML = "var overlayDiv = document.getElementById('" + overlayDivId + "');Drag.init(overlayDiv);overlayDiv.onDrag = function(x, y){pixelPerfect.publicDocument.notifyPanelOverlayPositionHasChanged();};overlayDiv.onDragEnd = function(x, y){pixelPerfect.publicDocument.notifyPanelOverlayPositionHasChanged(); pixelPerfect.publicDocument.notifyToSaveLastPosition();};"
            
            this.appendScriptElementAsChild(draggablePP, pageBody);
            //this.updatePanelDisplayOfXAndY(this.getPref("pixelPerfect.lastXPos"), this.getPref("pixelPerfect.lastYPos"));
            
            // save last overlay
            this.setPrefValue("pixelPerfect.lastOverlayFileName", overlayUrl);
        },
        
        appendScriptElementAsChild: function(scriptElement, parentElement){
            parentElement.appendChild(scriptElement);
        },
        
        removeChildElement: function(childElement, parentElement){
            if (childElement != null) {
                parentElement.removeChild(childElement);
            }
        },
        
        deleteOverlay: function(eyeLiId, eyeDivId, fileName){
            var panelDocument = getDocuments().panel,
            	mainDocument = getDocuments().main;
            var eyeDiv = panelDocument.getElementById(eyeDivId);
            if (eyeDiv.className == "eye-on-img") {
                var pageBody = mainDocument.getElementsByTagName("body")[0];
                var pixelperfect = mainDocument.getElementById(overlayDivId);
                pageBody.removeChild(pixelperfect);
            }
            
            var eyeDiv = panelDocument.getElementById(eyeLiId);
            panelDocument.getElementById("overlay-list").removeChild(eyeDiv);
            this.deleteFile(fileName);
        },
        
        deleteFile: function(fileToDelete){
            var deleteFile = this.getFirefoxProfileRootFolder().clone();
            deleteFile.append('extensions');
            deleteFile.append('pixelperfectplugin@openhouseconcepts.com');
            deleteFile.append('chrome');
            deleteFile.append('pixelperfect');
            deleteFile.append('content');
            deleteFile.append('user_overlays');
            deleteFile.append(fileToDelete);
            try {
                deleteFile.remove(false);
            }
            catch (e) {
                alert(e);
            }
        },
        
        getImageDimensions: function(overlayUrl){
            var overlayImage = new Image();
            overlayImage.src = overlayUrl;
            var width = overlayImage.width;
            var height = overlayImage.height;
            
            if (width == null || width == '0' || height == null || height == '0') {
                width = '1280';
                height = '1024';
            }
            
            return [width + 'px', height + 'px'];
        },
        
        getFirefoxProfileRootFolder: function(){
            // get the nsIFile obj => user's home (profile) directory
            const DIR_SERVICE = new Components.Constructor("@mozilla.org/file/directory_service;1", "nsIProperties");
            var nsIFileObj;
            try {
                nsIFileObj = (new DIR_SERVICE()).get("ProfD", Components.interfaces.nsIFile);
            }
            catch (e) {
                alert("error");
            }
            return nsIFileObj;
        },

        opacitySliderUpdate: function() {
            var sliderRawValue = getDocuments().panel.getElementById('opacity-slider').value,
                opacitySliderValue = null;
            
            if (sliderRawValue == 0 || isNaN(sliderRawValue)) {
                opacitySliderValue = 0;
            } else {
                opacitySliderValue = sliderRawValue / 100;
            }

            opacity = opacitySliderValue;

            // update current overlay opacity
            var pixelperfect = getDocuments().main.getElementById(overlayDivId);
            pixelperfect.style.opacity = opacity;
            pixelperfect.style.MozOpacity = opacity;
            
            // persist opacity pref
            this.setPrefValue("pixelPerfect.opacity", opacity);
        },

        roundNumber: function(num, dec){
            var result = Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
            return result;
        },
        
        leftArrowMove: function(){
            var newXPos = (this.findPixelPerfectXPos() - 1);
            this.moveX(newXPos);
        },
        
        rightArrowMove: function(){
            var newXPos = (this.findPixelPerfectXPos() + 1);
            this.moveX(newXPos);
        },
        
        topArrowMove: function(){
            var newYPos = (this.findPixelPerfectYPos() - 1);
            this.moveY(newYPos);
        },
        
        bottomArrowMove: function(){
            var newYPos = (this.findPixelPerfectYPos() + 1);
            this.moveY(newYPos);
        },
        
        togglePositionLock: function(chkEle) {
          overlayLocked = chkEle.checked;
          this.updateDragStatus();
          this.togglePointerEvents();
          this.setPrefValue("pixelPerfect.overlayLocked", overlayLocked);
        },
        
        updateZIndex: function(zIndexInputEle) {
        	var zIndexInputEle = getDocuments().panel.getElementById('z-index-input'),
          		ppOverlayEle = getDocuments().main.getElementById(overlayDivId);
          ppOverlayEle.style.zIndex = zIndexInputEle.value;
          this.setPrefValue("pixelPerfect.zIndex", zIndexInputEle.value);
        },

        togglePointerEvents: function () {
            var pp_overlay = getDocuments().main.getElementById(overlayDivId);
            var pointerEventsVal = (overlayLocked) ? 'none' : 'auto'; 
            pp_overlay.style.pointerEvents = pointerEventsVal;
        },
        
        updateDragStatus: function() {
          var mainDocument = getDocuments().main;
          
          var pageBody = mainDocument.getElementsByTagName("body")[0];
          //remove previous
          var updateDragStatusScriptID = "update-drag-status";
          var existingDragStatusScript = mainDocument.getElementById(updateDragStatusScriptID);
          this.removeChildElement(existingDragStatusScript, pageBody);
          
          // add new drag status (which will lock/unlock dragging based on state of overlayLocked instance)
          var dragStatusScript = mainDocument.createElement("script");
          dragStatusScript.setAttribute("type", "text/javascript");
          dragStatusScript.setAttribute("id", updateDragStatusScriptID);
          dragStatusScript.innerHTML = "Drag.disabled = " + overlayLocked;
          
          this.appendScriptElementAsChild(dragStatusScript, pageBody);
        },
        
        moveX: function(xPos){
            this.moveElement(xPos, this.findPixelPerfectYPos());
        },
        
        moveY: function(yPos){
            this.moveElement(this.findPixelPerfectXPos(), yPos);
        },
        
        moveElement: function(xPos, yPos){
            if(!overlayLocked) {
              //this.updatePanelDisplayOfXAndY(xPos, yPos);
              this.setPrefValue("pixelPerfect.lastXPos", xPos);
              this.setPrefValue("pixelPerfect.lastYPos", yPos);
              
              pp_overlay = getDocuments().main.getElementById(overlayDivId);
              pp_overlay.style.top = yPos + 'px';
              pp_overlay.style.left = xPos + 'px';
            }
        },
        
        findPixelPerfectXPos: function(){
            return this.findPixelPerfectPos()[0];
        },
        
        findPixelPerfectYPos: function(){
            return this.findPixelPerfectPos()[1];
        },
        
        findPixelPerfectPos: function(){
            return this.findPos(getDocuments().main.getElementById(overlayDivId));
        },
        
        findPos: function(obj){
            var curleft = curtop = 0;
            if (obj.offsetParent) {
                do {
                    curleft += obj.offsetLeft;
                    curtop += obj.offsetTop;
                }
                while (obj = obj.offsetParent);
                return [curleft, curtop];
            }
        },
        
        //@deprecated
        updatePanelDisplayOfXAndY: function(xPos, yPos){
            // var xPosNumber = getDocuments().panel.getElementById('ctl-left-position');
            // xPosNumber.innerHTML = xPos;
            
            // var yPosNumber = getDocuments().panel.getElementById('ctl-top-position');
            // yPosNumber.innerHTML = yPos;
        }
        
        
    };
})();