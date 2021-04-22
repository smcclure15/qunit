QUnit.testDone( () => {
	throw new Error( "Error in testDone" );
} );

QUnit.test( "Test A", assert => {
	assert.true( true );
} );
