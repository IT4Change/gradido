#ifndef DR_MNEMONIC_H
#define DR_MNEMONIC_H

/*!
 * 
 * @author: einhornimmond
 * 
 * @date: 16.06.19
 * 
 * @desc: Class for handling mnemonic word list, unpacking, reverse lookup
 * 
 */

#include "../lib/DRHashList.h"
#include "Poco/Mutex.h"
#include <string>
#include <map>

#define PHRASE_WORD_COUNT 24


class Mnemonic 
{
public: 
	Mnemonic();
	~Mnemonic();

	int init(void(*fill_words_func)(unsigned char*), unsigned int original_size, unsigned int compressed_size);

	inline const char* getWord(unsigned int index) { Poco::Mutex::ScopedLock _lock(mWorkingMutex, 500); if (index < 2048 && index >= 0) return mWords[index]; return nullptr; }
	inline unsigned short getWordIndex(const char* word) { Poco::Mutex::ScopedLock _lock(mWorkingMutex, 500);  DHASH word_hash = DRMakeStringHash(word); return mWordHashIndices.find(word_hash)->second; }
	inline bool isWordExist(const std::string& word) { Poco::Mutex::ScopedLock _lock(mWorkingMutex, 500);  DHASH word_hash = DRMakeStringHash(word.data());  return mWordHashIndices.find(word_hash) != mWordHashIndices.end(); }
	// using only for debugging
	std::string getCompleteWordList();

protected:

	void clear();

	char* mWords[2048];
	//DRHashList mWordHashIndices;
	typedef std::pair<DHASH, unsigned short> WordHashEntry;
	std::map<DHASH, unsigned short> mWordHashIndices;
	Poco::Mutex mWorkingMutex;

};

#endif //DR_MNEMONIC_H
