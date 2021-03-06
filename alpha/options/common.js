/*
 * This file is used by both the client to populate the Backbone models and the
 * server to render the actual options panel.
 */

/*
 * Same shit as `../../common.js`. Need to make sure both node and the client
 * load only what they need and don't crash with refference errors.
 */
var isNode = typeof navigator === 'undefined';

var common = require('../../common'),
	$, banner, config, hotConfig, main, notMobile, options, state;
if (isNode) {
	config = require('../../config');
	//XXX: Uggly hack, but we need the hot variables before they are exported
	hotConfig = require('../../hot').hot;
	// For compatibility reasons
	notMobile = true;
}
else {
	$ = require('jquery');
	banner = require('../banner');
	main = require('../main');
	options = require('./index');
	state = require('../state');

	config =  state.config.attributes;
	hotConfig = state.hotConfig.attributes;
	notMobile = !main.isMobile;
}

/*
 * Full schema of the options model
 *
 * - id: Identifier of the option. Used for DOM element and localStorage tagging
 * - type: 'checkbox'/'number'/'image'/'shortCut'/array of options
 *	arrays become a selection list. Defaults to 'checkbox', if omitted.
 * - default: Default value. false, if omitted.
 * - tab: Index of the tab the option belong to.
 * - exec: Function to execute on option change.
 * - execOnStart: Boolean. Should the function be executed on model population?
 *	Defaults to true.
 * - load: Condition to display and execute the option. Defaults to true(always)
 * - boardSpecific: Different option setting for each board.
 * - validation: Function that validates the users input. Returns a boolean.
 *
 * Tooltips and lables are defined per language in `lang/`.
 * All arguments except for `id` and `tab` are optional.
 */

var opts = [
	/* LANGUAGE SELECTION */
	{
		id: 'lang',
		type: config.LANGS,
		tab: 0,
		default: config.DEFAULT_LANG,
		// True by default
		execOnStart: false,
		// Exec is not used on the server
		exec: function(type) {
			$.cookie('lang', type);
			alert('Language settings applied. The page will now reload.');
			location.reload();
		}
	},
	/* INLINE EXPANSION */
	{
		id: 'inlinefit',
		type: ['none', 'full', 'width', 'height', 'both'],
		tab: 1,
		default: 'width'
	},
	/* THUMBNAIL OPTIONS */
	{
		id: 'thumbs',
		boardSpecific: true,
		// Hardcoded to avoid circular dependancy on the server
		type: ['small', 'sharp', 'hide'],
		tab: 1,
		default: 'small',
		exec: function(type) {
			$.cookie('thumb', type);
			main.oneeSama.thumbStyle = type;
		}
	},
	/* IMAGE HOVER EXPANSION */
	{
		id: 'imageHover',
		load: notMobile,
		tab: 0,
	},
	{
		id: 'webmHover',
		load: notMobile,
		tab: 0
	},
	/* Autogif TOGGLE */
	{
		id: 'autogif',
		load: notMobile,
		tab: 1,
		exec: function(autogif) {
			$.cookie('agif', autogif, {path: '/'});
			main.oneeSama.autoGif = autogif;
		}
	},
	/* SPOILER TOGGLE */
	{
		id: 'noSpoilers',
		boardSpecific: true,
		type: 'checkbox',
		tab: 1,
		default: true,
		exec: function(spoilertoggle) {
			$.cookie('spoil', spoilertoggle, {path: '/'});
			main.oneeSama.spoilToggle = spoilertoggle;
		}
	},
	/* BACKLINKS */
	{
		id: 'nobacklinks',
		type: 'checkbox',
		tab: 0,
		default: true,
		// TODO: Implement backlinks in ./posts/index.js
		exec: function() {}
	},
	/* LINKIFY TEXT URLS */
	{
		id: 'linkify',
		tab: 0,
		exec: function(toggle) {
			$.cookie('linkify', toggle, {path: '/'});
		}
	},
	/* DESKTOP NOTIFICATIONS */
	{
		id: 'notification',
		load: notMobile,
		tab: 0,
		exec: function(notifToggle) {
			if (notifToggle && (Notification.permission !== "granted"))
				Notification.requestPermission();
		}
	},
	/* ANONIMISE ALL POSTER NAMES */
	{
		id: 'anonymise',
		tab: 0
	},
	/* RELATIVE POST TIMESTAMPS */,
	{
		id: 'relativeTime',
		tab: 0,
		exec: function(toggle) {
			$.cookie('rTime', toggle, {path: '/'});
		}
	},
	/* R/A/DIO NOW PLAYING BANNER */
	{
		id: 'nowPlaying',
		load: notMobile && config.RADIO,
		type: 'checkbox',
		tab: 3,
		default: true,
		exec: function(toggle) {
			if (toggle)
				banner.view.clearRadio();
			// Query the server for current stream info
			else
				main.send([common.RADIO]);
		}
	}
];

/* IMAGE SEARCH LINK TOGGLE */
['google', 'iqdb', 'saucenao', 'foolz', 'exhentai'].forEach(function(search) {
	opts.push({
		id: search,
		// Use a custom internatiolisation function
		lang: 'imageSearch',
		tab: 2,
		exec: function(toggle) {
			var $style = $('#' + search + 'Toggle');
			if (!$style.length) {
				$style = $('<style/>', {id: search + 'Toggle'})
					.html('.' + search + '{display:none;}')
					.appendTo('head');
			}
			$style.prop('disabled', toggle);
		}
	});
});

/* ILLYA DANCE */
var illyaDance = {
	id: 'illyaBGToggle',
	load: notMobile && hotConfig.ILLYA_DANCE,
	boardSpecific: true,
	tab: 3,
	exec: function(illyatoggle) {
		var muted = ' ';
		if (options.get('illyaMuteToggle'))
			muted = 'muted';
		var dancer = '<video autoplay ' + muted + ' loop id="bgvid" >' +
			'<source src="' + mediaURL + 'illya.webm" type="video/webm">' +
			'<source src="' + mediaURL + 'illya.mp4" type="video/mp4">' +
			'</video>';
		if (illyatoggle)
			$("body").append(dancer);
		else
			$("#bgvid").remove();
	}
};

opts.push(illyaDance,
	{
		id: 'illyaMuteToggle',
		load: notMobile && hotConfig.ILLYA_DANCE,
		boardSpecific: true,
		tab: 3,
		exec: function() {
			if (options.get('illyaBGToggle')) {
				illyaDance.exec(false);
				illyaDance.exec(true);
			}
		}
	},
	/* HORIZONTAL POSTING */
	{
		id: 'horizontalPosting',
		boardSpecific: true,
		tab: 3,
		exec: function(toggle) {
			var style = '<style id="horizontal">article,aside{display:inline-block;}</style>';
			if (toggle)
				$('head').append(style);
			else
				$('#horizontal').remove();
		}
	},
	/* REPLY AT RIGHT */
	{
		id: 'replyright',
		tab: 1,
		exec: function(r) {
			if (r)
				$('<style/>', {
					id: 'reply-at-right',
					text: 'aside { margin: -26px 0 2px auto; }',
				}).appendTo('head');
			else
				$('#reply-at-right').remove();
		}
	},
	/* THEMES */
	{
		id: 'theme',
		boardSpecific: true,
		// Arrays will turn into selection boxes
		type: [
			'moe',
			'gar',
			'mawaru',
			'moon',
			'ashita',
			'console',
			'tea',
			'higan',
			'rave',
			'tavern',
			'glass'
		],
		tab: 1,
		default: isNode ? null : hotConfig.BOARD_CSS[state.page.get('board')],
		exec: function(theme) {
			if (theme) {
				var css = hotConfig.css[theme + '.css'];
				$('#theme').attr('href', state.imagerConfig.get('MEDIA_URL')
					+ 'css/' + css);
			}
			// FIXME: temp stub
			// Call the background controller to generate, remove and/or append the glass
			//background.glass(theme);
		}
	},
	/* CUSTOM USER-SET BACKGROUND */
	{
		id: 'userBG',
		load: notMobile,
		tab: 1,
	},
	{
		id: 'userBGimage',
		load: notMobile,
		type: 'image',
		tab: 1,
		// FIXME
		//exec: background.set
	},
	/* LAST N CONFIG */
	{
		id: 'lastn',
		type: 'number',
		tab: 0,
		validation: common.reasonable_last_n,
		default: hotConfig.THREAD_LAST_N,
		exec: function(n) {
			main.oneeSama.lastN = n;
			$.cookie('lastn', n, {path: '/'});
		}
	},
	/* KEEP THREAD LENGTH WITHIN LASTN */
	{
		id: 'postUnloading',
		tab: 0,
	},
	/* LOCK TO BOTTOM EVEN WHEN DOCUMENT HIDDEN*/
	{
		id: 'alwaysLock',
		tab: 0,
	}
);

/* SHORTCUT KEYS */
[
	{
		id: 'new',
		default: 78,
	}, {
		id: 'togglespoiler',
		default: 73,
	}, {
		id: 'textSpoiler',
		default: 68,
	}, {
		id: 'done',
		default: 83,
	}, {
		id: 'expandAll',
		default: 69,
	}
].forEach(function(short) {
	short.type = 'shortcut';
	short.tab = 4;
	opts.push(short);
});

module.exports = opts;