// Detect if the current browser supports `onunhandledrejection` (avoiding
// errors for browsers without the capability)
var HAS_UNHANDLED_REJECTION_HANDLER = "onunhandledrejection" in window;

if ( HAS_UNHANDLED_REJECTION_HANDLER ) {
	QUnit.module( "Unhandled Rejections inside test context", function( hooks ) {
		hooks.beforeEach( function( assert ) {
			var originalPushResult = assert.test.pushFailure;
			assert.test.pushFailure = function( msg ) {
				assert.test.pushFailure = originalPushResult;

				assert.equal( msg, "Error thrown in non-returned promise!" );
			};
		} );

		QUnit.test( "test passes just fine, but has a rejected promise", function( assert ) {
			var done = assert.async();

			Promise.resolve().then( function() {
				throw new Error( "Error thrown in non-returned promise!" );
			} );

			// prevent test from exiting before unhandled rejection fires
			setTimeout( done, 10 );
		} );

	} );
}
