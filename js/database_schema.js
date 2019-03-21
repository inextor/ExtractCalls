export default {
	name		: "calls"
	,version	: 2
	,stores		:
	{
		calls :
		{
			keyPath	: 'id'
			,autoincrement	: false
			,indexes	:
			[
				{ indexName: "date", keyPath:"date", objectParameters: { uniq : false, multiEntry: false, locale: 'auto'  } }
			]
		}
	}
};
