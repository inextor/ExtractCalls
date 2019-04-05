export default {
	name		: "calls"
	,version	: 5
	,stores		:
	{
		calls :
		{
			keyPath	: 'id'
			,autoincrement	: false
			,indexes	:
			[
				{ indexName: 'date', keyPath:'date', objectParameters: { uniq : false, multiEntry: false, locale: 'auto'  } },
				{ indexName: 'phones', keyPath: 'phones', objectParameters: { uniq: false, multiEntry: true, locale: 'auto' } }
			]
		}
	}
};
