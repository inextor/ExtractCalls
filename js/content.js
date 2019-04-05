import Finger from '../Finger/DatabaseStore.js';
import Client from '../Extension-Framework/Client.js';
import config from './config.js';

var client	= new Client();

setTimeout(()=>window.location.reload(), 30*60*1000  );

export default function main()
{
    console.log('Loaded');

	if( window.location.hostname !== config.site )
	{
		console.log('No config site', config.site, window.location.hostname );
		return;
	}

	var interval_id = setInterval(  loop_function, 20000 );
}

function loop_function()
{
		//Check Login
	if( window.location.pathname === "/access/unauthenticated" )
	{
		console.log('Unauthorized page');
		let iframe = document.querySelector('iframe');
		let doc		= iframe.contentWindow.document;

		let input 		= doc.getElementById('user_email');
		input.value 	= config.email;
		let password	= doc.getElementById('user_password');
		password.value  = config.password;
		let button		= doc.querySelector('.button.primary');
		button.click();
		return;
	}

	let iframe = document.querySelector('iframe[src="/voice/admin/settings"]');
	if( iframe )
	{
		let doc = iframe.contentWindow.document;
		if( ! doc )
			return;

		var divSettings = doc.querySelector('.voice-settings li[aria-selected="true"]>div');

        if( divSettings )
        {
            let text = divSettings.textContent;

            if( text == 'Settings' )
            {
				console.log('Going to history');
                let panels  = Array.from( doc.querySelectorAll('.voice-settings li[aria-selected="false"]>div') );
                let history = panels.find( i=>i.textContent == 'History' );

                if( history )
                {
                    history.click();
                    return;
                }
            }


			if( text == 'History' )
			{
				console.log("Now is selected ", text );
				//Parse calls And Next
				extractCalls( doc ).then(( calls )=>
				{
					client.executeOnBackground('AddCalls',{ calls : calls });

					let prev = doc.querySelector('footer div[role="navigation"] div[aria-label="Previous Page"][aria-hidden="false"]');

					if( prev )
					{
						prev.click();
					}
					else
					{
						let next = doc.querySelector('footer div[role="navigation"] div[aria-label="Next Page"]');

						if( next )
							next.click();
					}
				});
				return;
			}
        }

		console.log('It reach the left and 2');
		/*
		var first = doc.querySelector('.c-btn.c-pagination--left');
		var one		= doc.querySelector('button.c-btn.is-active[value="1"]');
		var historyAnchor = doc.querySelector('li.tab-history span:nth-child(2)');

		if( one )
		{
			doc.querySelector('.c-pagination.center button[value="2"]').click();
		}
		else if( first )
		{
		    first.click();
		}
		else if( historyAnchor )
		{
			historyAnchor.click();
		}
		*/
	}
	else if( window.location.href == 'https://'+config.host_prefix+'/agent/admin/overview' )
	{
		console.log('On Overview to go to voice page');
		let a			= Array.from( document.querySelectorAll('li>a') );
		let talk_link	= a.find(i=> i.getAttribute('href') == '/agent/admin/voice' );

		if( talk_link )
			talk_link.click();
	}
	else if( window.location.href != 'https://'+config.host_prefix+'/agent/admin/voice' )
	{
		console.log('On Voice Page gon to admin link');
		let gear = document.querySelector('.toolbar_link.branding__color--contrast.admin_link');
		gear.click();
	}
	else
	{
		console.log('Now We are good');

		if( calls.length > 0  )
		{
			console.log("Calls Found", calls );
			//client.sendCustomRequest( 'calls_found', calls );
		}
	}
}

function extractCalls( doc )
{
	console.log('Extract Calls');

	let calls	= [];
	var trs		= doc.querySelectorAll('.c-history-ticket-details article tr');

	for(let i=0;i<trs.length;i++)
	{
		var tr =  trs[ i ];
		var tds	= tr.querySelectorAll('td');

		var call = {};

		for(let j=0;j<tds.length;j++)
		{
			var td	= tds[ j ];

			for(var k=0;k<td.classList.length;k++)
			{
				let name = td.classList.item( k );

				if( /^qa-/.test(name) )
				{
					if( name == "qa-charge" )
					{
						let a = td.querySelector('a');
						call[ name ]	= a.textContent.trim();
					}
					else
					{
						call[ name ] = td.textContent.trim();
					}
				}
			}
		}

		if( call['qa-charge']  == 'Retrieving charge' )
		{
			continue;
		}

		if( typeof call['qa-call-id']  !== 'undefined' )
		{
			calls.push( call );
		}
	}

	return Promise.resolve( calls );
}

