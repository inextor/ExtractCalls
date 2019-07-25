import Finger from '../Finger/DatabaseStore.js';
import Server from '../Extension-Framework/Server.js';
import config from './config.js';
import database_schema from './database_schema.js';
import PromiseUtil from '../PromiseUtils/PromiseUtils.js';
import Utils from '../Diabetes/Util.js';

window.onerror = function(err){
    console.log(err); // logs all errors
};

let db = new Finger( database_schema );

db.init().then(()=> console.log('DB initialized')).catch((e)=>
{
	console.error('Error intializing', e );
});

var ext			= new Server();

ext.addPageLoadListener( config.load_listener ,true,()=>
{
	console.log('Page Loaded', new Date() );
});

var init    = new Date();
var last_call = new Date();

setInterval(()=>
{
	let current = new Date();
	current.setMinutes( current.getMinutes() -5 );

	if( last_call <  current );
	{
		makeCallBacks().catch((e)=>{
			console.log( e );
		});
	}

}, 60*1000 );



ext.addListener('AddCalls',(url,request,tab_id)=>
{
	console.log('Adding calls', request, new Date() );
	processCallsFound( request.calls );
});


function getUTCMysqlTimestamp( str )
{
    let d       = new Date(str);
	let z_number = n=> n > 9 ? n : '0'+n;

	let month	= z_number( d.getUTCMonth()+1);
	let days	= z_number( d.getUTCDate() );

    let seconds = z_number( d.getUTCSeconds() );
    let min     = z_number( d.getUTCMinutes() );
    let hour    = z_number( d.getUTCHours() );

	return d.getFullYear()+'-'+month+'-'+days+' '+hour+':'+min+':'+seconds;
}

function getMysqlTimestamp( str )
{
    let d       = new Date(str);
	let z_number = n=> n > 9 ? n : '0'+n;

	let month	= z_number( d.getMonth()+1);
	let days	= z_number( d.getDate() );

    let seconds = z_number( d.getSeconds() );
    let min     = z_number( d.getMinutes() );
    let hour    = z_number( d.getHours() );

	return d.getFullYear()+'-'+month+'-'+days+' '+hour+':'+min+':'+seconds;
}

function getDateString( str )
{

    let month   = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    let d       = new Date(str);
    let hour    = d.getHours()%12;

    if( hour === 0 )
        hour = 12;

    let m       = d.getHours() > 11 ? 'PM':'AM';
    let min     = d.getMinutes();


    let dateString = month[ d.getMonth() ]+' '+d.getDate()+' '+d.getFullYear()+' '+(hour < 10 ? '0'+hour: hour)+':'+(min<10?'0'+min:min)+' '+m;
    return dateString;
}

function getCall( call_info )
{
	let call_obj = {
		id				: call_info['qa-call-id']
		,ticket_id		: call_info['qa-ticket-id']
		,date			: getUTCMysqlTimestamp( call_info['qa-datetime'] )
		,local_time		: getMysqlTimestamp( call_info['qa-datetime'] )
		,to				: call_info['qa-to']
		,is_solved: false
		,from			: call_info['qa-from']
		,agent			: call_info['qa-agent']
		,call_status	: call_info['qa-status']
		,wait_time		: call_info['qa-wait-time']
		,hold_time		: call_info['qa-hold-time']
		,wrap_up_time	: call_info['qa-wrap-up-time']
		,minutes		: call_info['qa-minutes']
		,charge			: call_info['qa-charge']
		,phones			: [ call_info['qa-from'],call_info['qa-to'] ]
	};

	return db.get('calls', call_obj.id  ).then(( obj )=>
	{
		if( obj !== undefined )
			return Promise.resolve( obj );

		return Promise.resolve( call_obj );
	});
}

function createTicket(call)
{
	console.log('Making a http call for create a ticket',call);

	return Promise.resolve( call );

	let data = new FormData();
	data.append("title", "Missed Call From "+call.from+' '.call.date );
	data.append("message","Mised call from:"+
	    call.from+' '+call.date+'\r'+
	    'Call Status: '+call.call_status+'\n'
	    'Call To: '+call.to+'\r'
	    'Wait Time: '+call.wait_time+'\r'
	    'Hold Time: '+call.hold_time
	)

	fetch( config.create_ticket_url ,{method: "POST", body: data})
	  .then((response)=>
	  {
	    return response.json()
	  })
	  .then((json)=>{
	    console.log( json );
	  })
	  .catch((e)=>
	  {
	    console.error("An error occurred",e)
	  });

}

function processCallsFound( calls_info )
{
	console.log('Processign calls found');
	if( Array.isArray( calls_info ) )
	{
		let calls		= [];
		let generator	= (call_info)=> getCall(call_info).then((call)=>
		{
			if( !call.saved )
			{
				call.saved = true;
				return db.put('calls', call ).then(()=>
				{
					return call.call_status === 'Abandoned In Queue' ?
						createTicket( call ) :
						Promise.resolve( call );
				});
			}
			return Promise.resolve( null );
		});

		PromiseUtil.runSequential( calls_info, generator ).then((not_saved_calls)=>
		{
			let calls_to_save = not_saved_calls.filter( a => a !== null );

			if( calls_to_save.length > 0 )
			{
				console.log('Sending calls to be saved',calls_to_save);
				saveCallsOnServer( calls_to_save )
			}
		})
		.catch((e)=>
		{
			console.log('Error on proccessing calls', e );
		});
	}
}

function saveCallsOnServer( calls_to_save )
{
  let data = { calls: calls_to_save };
  let formData = Utils.getFormData( data );

  fetch( config.add_calls_url, { method: "POST", body: formData } )
    .then((response)=>
    {
      return response.json();
    })
    .then((response)=>{
      console.log('Response from server was', response );
    })
    .catch((error)=>{
      console.log('An error occurred saving the calls on server',error);
    });

}

function call_was_solved( call )
{
	if( call.is_solved )
		return Promise.resolve( true );

	return db.getAll('calls',{ index: 'date', '>=': call.from } ).then((calls)=>
	{
		let call_resolved =  calls.some( other =>{
			if( other.id === call.id )
				return false;

			if( other.to === call.from || other.from === call.from)
			{
				if( other.date > call.date && other.call_status === 'Completed' )
					return true;
			}
			return false;
		});

		return Promise.resolve( call_resolved.length > 0 );
	});
}

function getLostCalls()
{
	let zero_n		= n => n>9 ? n : '0'+n;
	let date 		= new Date();
	date.setHours( date.getHours() -3 );

	let dateString	= getUTCMysqlTimestamp( date.toString() );
	console.log("looking for calls >=", dateString );
	return db.getAll('calls',{index:'date', '>=': dateString })
	.then((calls)=>
	{
		return Promise.resolve(calls.filter( call => call.call_status === 'Abandoned In Queue' ));
	});
}

function makeCallBacks()
{
	return getLostCalls().then((lost_calls)=>
	{
		let generator = (call)=>
		{
			return call_was_solved( call ).then((is_solved)=>
			{
				if( !is_solved )
				{
					//Send Callback
					call.is_solved = true;
					return db.put('calls',call ).then(()=>
					{
						console.log('Call lost found', call.from, call.local_time );
						return Promise.reject('Call Found');
					});
				}
				return Promise.resolve( true );
			});
		};

		return PromiseUtil.runSequential( lost_calls, generator );
	});
}
