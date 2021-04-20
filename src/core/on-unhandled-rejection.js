
import { pushFailure } from "../test";
import config from "./config";
import { sourceFromStacktrace } from "./stacktrace";

// Handle an unhandled rejection
export default function onUnhandledRejection( reason ) {

	const currentTest = config.current;
	if ( currentTest ) {
		pushFailure(
			reason.message || "error",
			reason.stack || sourceFromStacktrace( 3 ) );
	}

	// otherwise let the underlying process handle it
}

