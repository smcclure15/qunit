QUnit.done( () => {
	throw new Error( "Error in Done" );
} );

QUnit.test( "Test A", assert => {
	assert.true( true );
} );
