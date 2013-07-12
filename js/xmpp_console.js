var Console = {	
	show_traffic: function (body, type) {
        if (body.childNodes.length > 0) {
            var console = jQuery('#console').get(0);
            var at_bottom = console.scrollTop >= console.scrollHeight - console.clientHeight;

            jQuery.each(body.childNodes, function () {
                jQuery('#console').append("<div class='" + type + "'>" + 
                                     Console.pretty_xml(this) +
                                     "</div>");
            });

            if (at_bottom) {
                console.scrollTop = console.scrollHeight;
            }
        }
    },

    pretty_xml: function (xml, level) {
        var i, j;
        var result = [];
        if (!level) { 
            level = 0;
        }

        result.push("<div class='xml_level" + level + "'>");
        result.push("<span class='xml_punc'>&lt;</span>");
        result.push("<span class='xml_tag'>");
        result.push(xml.tagName);
        result.push("</span>");

        // attributes
        var attrs = xml.attributes;
        var attr_lead = []
        for (i = 0; i < xml.tagName.length + 1; i++) {
            attr_lead.push("&nbsp;");
        }
        attr_lead = attr_lead.join("");

        for (i = 0; i < attrs.length; i++) {
            result.push(" <span class='xml_aname'>");
            result.push(attrs[i].nodeName);
            result.push("</span><span class='xml_punc'>='</span>");
            result.push("<span class='xml_avalue'>");
            result.push(attrs[i].nodeValue);
            result.push("</span><span class='xml_punc'>'</span>");

            if (i !== attrs.length - 1) {
                result.push("</div><div class='xml_level" + level + "'>");
                result.push(attr_lead);
            }
        }

        if (xml.childNodes.length === 0) {
            result.push("<span class='xml_punc'>/&gt;</span></div>");
        } else {
            result.push("<span class='xml_punc'>&gt;</span></div>");

            // children
            jQuery.each(xml.childNodes, function () {
                if (this.nodeType === 1) {
                    result.push(Console.pretty_xml(this, level + 1));
                } else if (this.nodeType === 3) {
                    result.push("<div class='xml_text xml_level" + 
                                (level + 1) + "'>");
                    result.push(this.nodeValue);
                    result.push("</div>");
                }
            });
            
            result.push("<div class='xml xml_level" + level + "'>");
            result.push("<span class='xml_punc'>&lt;/</span>");
            result.push("<span class='xml_tag'>");
            result.push(xml.tagName);
            result.push("</span>");
            result.push("<span class='xml_punc'>&gt;</span></div>");
        }
        
        return result.join("");
    },

    text_to_xml: function (text) {
        var doc = null;
        if (window['DOMParser']) {
            var parser = new DOMParser();
            doc = parser.parseFromString(text, 'text/xml');
        } else if (window['ActiveXObject']) {
            var doc = new ActiveXObject("MSXML2.DOMDocument");
            doc.async = false;
            doc.loadXML(text);
        } else {
            throw {
                type: 'PeekError',
                message: 'No DOMParser object found.'
            };
        }

        var elem = doc.documentElement;
        if (jQuery(elem).filter('parsererror').length > 0) {
            return null;
        }
        return elem;
    }
};

// console buttons
function console_disconnect() {
	/*
	BSOH sends 'unavailable' automatically in 2-3 minutes 
	if (Client.roster.length > 0) {
    	for (i = 0; i < Client.roster.length; ++i) {
		    console.log("will send unavailable to " + Client.roster[i]);
			Client.connection.send($pres({
				to: Client.roster[i],
				"type": "unavailable"}));
		}
	}*/ 
	Client.connection.sync = true; // Switch to using synchronous requests since this is typically called onUnload.
	Client.connection.flush();
	Client.connection.disconnect();
	
	Client.replace_contact(jQuery('.me')[0], false);
	
	return false;
}

function console_send() {
        var input = jQuery('#console_input').val();
        var error = false;
        if (input.length > 0) {
            if (input[0] === '<') {
                var xml = Console.text_to_xml(input);
                if (xml) {
                    Client.connection.send(Strophe.copyElement(xml));
                    jQuery('#console_input').val('');
                } else {
                    error = true;
                }
            } else if (input[0] === '$') {
                try {
                    var builder = eval(input);
                    Client.connection.send(builder);
                    jQuery('#console_input').val('');
                } catch (e) {
                    console.log(e);
                    error = true;
                }
            } else {
                error = true;
            }
        }

        if (error) {
            jQuery('#console_input').animate({backgroundColor: "#faa"});
        }
}

jQuery('#input').keypress(function () {
	jQuery(this).css({backgroundColor: '#fff'});
});

