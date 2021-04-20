QUnit.begin( () => {
	throw new Error( "Error in Begin" );
} );

QUnit.test( "Test A", assert => {
	assert.true( true );
} );
