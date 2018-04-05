import * as fs from 'fs'

try { fs.unlinkSync('accountsToUpdate') } catch { }
try { fs.unlinkSync('birthdayParticipants') } catch { }
try { fs.unlinkSync('blockchainsync') } catch { }
try { fs.unlinkSync('confirmationCodes') } catch { }
try { fs.unlinkSync('kvstore') } catch { }
try { fs.unlinkSync('wavesbalance') } catch { }
