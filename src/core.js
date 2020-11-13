import { window, document, setTimeout } from "./globals";

import equiv from "./equiv";
import dump from "./dump";
import module from "./module";
import Assert from "./assert";
import Logger from "./logger";
import Test, { test, pushFailure } from "./test";
import exportQUnit from "./export";

import config from "./core/config";
import { extend, objectType, is, now } from "./core/utilities";
import { registerLoggingCallbacks, runLoggingCallbacks } from "./core/logging";
import { sourceFromStacktrace } from "./core/stacktrace";
import ProcessingQueue from "./core/processing-queue";

import SuiteReport from "./reports/suite";

import { on, emit } from "./events";
import onError from "./core/onerror";
import onUnhandledRejection from "./core/on-unhandled-rejection";

const QUnit = {};
export const globalSuite = new SuiteReport();

// The initial "currentModule" represents the global (or top-level) module that
// is not explicitly defined by the user, therefore we add the "globalSuite" to
// it since each module has a suiteReport associated with it.
config.currentModule.suiteReport = globalSuite;

// Figure out if we're running the tests from a server or not
QUnit.isLocal = ( window && window.location && window.location.protocol === "file:" );

// Expose the current QUnit version
QUnit.version = "@VERSION";


var StateMachine = {
	Uninitialized: class {
		start() {
			if ( config.autostart ) {
				currentStartState = new StateMachine.StartFailed();
				throw new Error( "Called start() outside of a test context when " +
					"QUnit.config.autostart was true" );
			}
			config.autostart = true;
		}
		load() {

			// Initialize the configuration options
			extend( config, {
				stats: { all: 0, bad: 0, testCount: 0 },
				started: 0,
				updateRate: 1000,
				autostart: true,
				filter: ""
			}, true );

			config.blocking = false;

			currentStartState = new StateMachine.OkToStart();

			// start immediately if possible
			if ( config.autostart ) {

				// start immediately
				currentStartState.start();
			}
		}
	},
	Initialized: class {
		load() {} // no-op
	}
};
extend( StateMachine, {
	UninitializedInNode: class extends StateMachine.Uninitialized {
		start() {
			super.start();

			// load immediately
			this.load();
		}
	},
	UninitializedInBrowser: class extends StateMachine.Uninitialized {
		start() {
			super.start();

			// mark OK and wait for browser load event to trigger
			currentStartState = new StateMachine.OkToStart();
		}
	},
	StartFailed: class extends StateMachine.Uninitialized {
		start() {
			throw new Error( "Called start() outside of a test context too many times" );
		}

		// load can still recover
	},
	OkToStart: class extends StateMachine.Initialized {
		start() {
			scheduleBegin();
			currentStartState = new StateMachine.RunStarted();
		}
	},
	RunStarted: class extends StateMachine.Initialized {
		start() {
			throw new Error( "Called start() while test already started running" );
		}
	}
} );

var currentStartState = document ?
	new StateMachine.UninitializedInBrowser() : new StateMachine.UninitializedInNode();

extend( QUnit, {
	on,

	module,

	test: test,

	// alias other test flavors for easy access
	todo: test.todo,
	skip: test.skip,
	only: test.only,

	start: function() {

		if ( config.current ) {
			throw new Error( "QUnit.start cannot be called inside a test context." );
		}

		currentStartState.start();
	},

	config: config,

	is: is,

	objectType: objectType,

	extend: function( ...args ) {
		Logger.warn( "QUnit.extend is deprecated and will be removed in QUnit 3.0." +
			" Please use Object.assign instead." );

		// delegate to utility implementation, which does not warn and can be used elsewhere internally
		return extend.apply( this, args );
	},

	load: function() {
		currentStartState.load();
	},

	stack: function( offset ) {
		offset = ( offset || 0 ) + 2;
		return sourceFromStacktrace( offset );
	},

	onError,

	onUnhandledRejection
} );

QUnit.pushFailure = pushFailure;
QUnit.assert = Assert.prototype;
QUnit.equiv = equiv;
QUnit.dump = dump;

registerLoggingCallbacks( QUnit );

function scheduleBegin() {

	// Add a slight delay to allow definition of more modules and tests.
	if ( setTimeout ) {
		setTimeout( function() {
			begin();
		} );
	} else {
		begin();
	}
}

function unblockAndAdvanceQueue() {
	config.blocking = false;
	ProcessingQueue.advance();
}

export function begin() {
	var i, l,
		modulesLog = [];

	// If the test run hasn't officially begun yet
	if ( !config.started ) {

		// Record the time of the test run's beginning
		config.started = now();

		// Delete the loose unnamed module if unused.
		if ( config.modules[ 0 ].name === "" && config.modules[ 0 ].tests.length === 0 ) {
			config.modules.shift();
		}

		// Avoid unnecessary information by not logging modules' test environments
		for ( i = 0, l = config.modules.length; i < l; i++ ) {
			modulesLog.push( {
				name: config.modules[ i ].name,
				tests: config.modules[ i ].tests
			} );
		}

		// The test run is officially beginning now
		emit( "runStart", globalSuite.start( true ) );
		runLoggingCallbacks( "begin", {
			totalTests: Test.count,
			modules: modulesLog
		} ).then( unblockAndAdvanceQueue );
	} else {
		unblockAndAdvanceQueue();
	}
}

exportQUnit( QUnit );

export default QUnit;
