#ifndef __JSON_INTERFACE_JSON_REQUEST_HANDLER_
#define __JSON_INTERFACE_JSON_REQUEST_HANDLER_

#include "Poco/Net/HTTPRequestHandler.h"
#include "Poco/JSON/Object.h"
#include "../model/Session.h"
#include "../lib/NotificationList.h"


class JsonRequestHandler : public Poco::Net::HTTPRequestHandler
{
public:

	JsonRequestHandler();

	void handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response);

	virtual Poco::JSON::Object* handle(Poco::Dynamic::Var params) = 0;

	static Poco::Dynamic::Var parseJsonWithErrorPrintFile(std::istream& request_stream, NotificationList* errorHandler = nullptr, const char* functionName = nullptr);

protected:
	Poco::JSON::Object* mResultJson;
	Poco::Net::IPAddress mClientIp;
	Session*			 mSession;

	Poco::JSON::Object* checkAndLoadSession(Poco::Dynamic::Var params);

	static Poco::JSON::Object* stateError(const char* msg, std::string details = "");
	static Poco::JSON::Object* customStateError(const char* state, const char* msg, std::string details = "");
	static Poco::JSON::Object* stateSuccess();


};

#endif // __JSON_INTERFACE_JSON_REQUEST_HANDLER_