
QUnit.module( "assert" );

function CustomError( message ) {
	this.message = message;
}

CustomError.prototype.toString = function() {
	return this.message;
};

QUnit.test( "throws", function( assert ) {
	assert.expect( 1 );

	assert.throws(
		function() {
			throw new CustomError( "some error description" );
		},
		err => {
			return err instanceof CustomError && /description/.test( err );
		},
		"custom validation function"
	);
} );

QUnit.test( "throws with expected class", function( assert ) {
	assert.expect( 1 );

	class CustomError extends Error {}

	assert.throws(
		() => {
			throw new CustomError( "foo" );
		},
		CustomError,
		"Expected value is a class extending Error"
	);
} );

QUnit.module( "failing assertions", {
	beforeEach: function( assert ) {
		const original = assert.pushResult;
		assert.pushResult = function( resultInfo ) {

			// Inverts the result so we can test failing assertions
			resultInfo.result = !resultInfo.result;
			original.call( this, resultInfo );
		};
	}
}, function() {
	QUnit.test( "throws", function( assert ) {
		assert.throws(
			function() {
				throw "foo";
			},
			() => false,
			"throws fails when expected function returns false"
		);
	} );

	QUnit.module( "inspect expected values", {
		beforeEach: function( assert ) {
			const original = assert.pushResult;
			assert.pushResult = function( resultInfo ) {

				// avoid circular asserts and use if/throw to verify
				if ( resultInfo.expected !== "TypeError: Class constructor CustomError cannot be invoked without 'new'" ) {
					throw new Error( "Unexpected value: " + resultInfo.expected );
				}

				// invoke the "outer" pushResult, which still inverts the result for negative testing
				original.call( this, resultInfo );
			};
		}
	}, function() {
		QUnit.test( "does not die when class is expected", function( assert ) {
			class CustomError extends Error {}

			assert.throws(
				() => {
					throw new Error( "foo" );
				},
				CustomError,
				"throws fails gracefully when expected value class does not use 'new'"
			);
		} );
	} );
} );
