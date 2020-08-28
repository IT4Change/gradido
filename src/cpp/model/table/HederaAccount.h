#ifndef GRADIDO_LOGIN_SERVER_MODEL_TABLE_HEDERA_ACCOUNTS_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TABLE_HEDERA_ACCOUNTS_INCLUDE

#include "ModelBase.h"
#include "Poco/Tuple.h"

namespace model {
	namespace table {

		typedef Poco::Tuple<int, int, int, int, Poco::UInt64, Poco::DateTime> HederaAccountTuple;

		class HederaAccount : public ModelBase
		{
		public:
			HederaAccount();
			HederaAccount(int user_id, int account_hedera_id, int account_key_id, Poco::UInt64 balance = 0);
			HederaAccount(const HederaAccountTuple& tuple);
			~HederaAccount();

			// generic db operations
			const char* getTableName() const { return "hedera_accounts"; }
			std::string toString();


		protected:
			Poco::Data::Statement _loadFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadMultipleFromDB(Poco::Data::Session session, const std::string& fieldName);
			Poco::Data::Statement _loadIdFromDB(Poco::Data::Session session);
			Poco::Data::Statement _insertIntoDB(Poco::Data::Session session);

			int mUserId;
			int mAccountHederaId;
			int mAccountKeyId;
			Poco::UInt64 mBalance;
			Poco::DateTime mUpdated;
		};

	}
}


#endif //GRADIDO_LOGIN_SERVER_MODEL_TABLE_HEDERA_ACCOUNTS_INCLUDE