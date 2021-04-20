
import config from "./config";
import { sourceFromStacktrace } from "./stacktrace";

// Handle an unhandled rejection
export default function onUnhandledRejection( reason ) {
	const resultInfo = {
		result: false,
		message: reason.message || "error",
		actual: reason,
		source: reason.stack || sourceFromStacktrace( 3 )
	};

	const currentTest = config.current;
	if ( currentTest ) {
		currentTest.assert.pushResult( resultInfo );
	}

	// otherwise let the underlying process handle it
}

