/*
 * Dice rolls and fun JS injections
 */

var $ = require('jquery'),
	common = require('../common'),
	main = require('./main'),
	state = require('./state');

// Render dice rolls and other hash commands
main.oneeSama.hook('imouto', function (imouto) {
	imouto.dice = true;
	imouto.queueRoll = function(bit) {
		var n = this.allRolls.sent++;
		var info = this.allRolls[n];
		if (!info)
			info = this.allRolls[n] = {};
		info.bit = bit;
		info.$tag = $(this.callback(safe('<strong>')));
		this.strong = true;
		this.callback(info.dice ? common.readable_dice(bit, info.dice) : bit);
		this.strong = false;
		this.callback(safe('</strong>'));
	};
	imouto.allRolls = {sent: 0, seen: 0};
});

// TODO: postform handling

// Execute server-sent JS in fun threads
main.dispatcher[common.EXECUTE_JS] = function (msg, op) {
	if (state.page.get('thread') != op)
		return;
	try {
		eval(msg[0]);
	}
	catch (e) {
		console.error(e);
	}
};