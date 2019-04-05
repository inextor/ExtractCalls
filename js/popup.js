import Util from './Diabetes/Util.js';
import Finger from './Finger/DatabaseStore.js';
import database_schema from './database_schema.js';
import config from './config.js';

window.onerror = function(err){
    console.log(err); // logs all errors
};

let db = new Finger( database_schema );
db.init().then(()=> console.log('DB initialized') );


document.addEventListener('DOMContentLoaded', function()
{
	Util.getById('sendCallsForToday').addEventListener('click',(evt)=>
	{
		Util.stopEvent( evt );
		let date = new Date();
		date.setHours( 0 );
		date.setMinutes( 0 );
		date.setSeconds( 0 );

		let dString = date.toISOString().substring(0,10)+' 00:00:00';

		db.getAll('calls',{ index: 'date', '>=' : dString }).then((calls)=>
		{
			console.log( calls );
			let obj = { calls: calls, xtinabotenable: false };
			let data = getFormData( obj );

			return fetch( config.add_calls_url, {
				method: 'POST',
				body:  data
			});
		})
		.then((response)=>
		{
			return response.text();
		})
		.then((text)=>
		{
			console.log('Success maybe???',text);
		})
		.catch((error)=>
		{
			console.log('An error occurred ',error );
		});
	});
});

function getFormData( obj )
{
    let formData = new FormData();

    let serialize = (obj, prefix)=>
    {
        let p;
        let str = [];

        for(p in obj)
        {
            if ( obj.hasOwnProperty( p ) )
            {
                var v = obj[p];
                var is_obj = typeof v == "object";
                var k = prefix ? prefix + "[" + (isNaN(+p) || is_obj ? p : '') + "]" : p;

                if( is_obj )
                    serialize( v, k );
                else
                    formData.append( k, v );
            }
        }
    };

    serialize(obj,'');
    return  formData;
}
