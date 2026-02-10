<?php

namespace App\Console\Commands;

use mysqli;
use Exception;
use Illuminate\Console\Command;

class AppsyncCommand extends Command
{
	protected $signature = 'appsync';

	protected $description = 'Sync database and/or files between local and remote';

	public function __construct()
	{
		parent::__construct();
	}

	public function handle(): void
	{
		$remoteHost       = env( 'APPSYNC_REMOTE_HOST' );
		$remoteUser       = env( 'APPSYNC_REMOTE_USER' );
		$remoteDbName     = env( 'APPSYNC_REMOTE_DBNAME' );
		$remoteDbUser     = env( 'APPSYNC_REMOTE_DBUSER' );
		$remoteDbPassword = env( 'APPSYNC_REMOTE_DBPASSWORD' );
		$remoteBasePath   = env( 'APPSYNC_REMOTE_BASEPATH' );
		$localBasePath    = env( 'APPSYNC_LOCAL_BASEPATH' );
		$localDbName      = env( 'APPSYNC_LOCAL_DBNAME' );
		$localDbHost      = env( 'APPSYNC_LOCAL_DBHOST' );
		$localDbPort      = env( 'APPSYNC_LOCAL_DBPORT' );
		$localDbUser      = env( 'APPSYNC_LOCAL_DBUSER' );
		$localDbPassword  = env( 'APPSYNC_LOCAL_DBPASSWORD' ) ?? '';
		$sshKeyPath       = env( 'APPSYNC_SSHKEY_PATH' );
		$sshPort          = 22;
		$localDumpFile    = $localBasePath . '/dump.sql';
		$remoteDumpFile   = $remoteBasePath . '/dump.sql';
		$remoteBackupFile = $remoteBasePath . '/backup_' . date( 'Y-m-d_H-i-s' ) . '.sql';

		$publicStoragePaths = [ '/storage/app/public' ];

		// Validate configuration
		if ( !$this->validateConfig( $sshKeyPath, $localBasePath, $remoteBasePath ) ) {
			return;
		}

		// Test local database connection
		if ( !$this->testLocalDatabase( $localDbHost, $localDbPort, $localDbUser, $localDbPassword, $localDbName ) ) {
			return;
		}

		// Test SSH connection
		if ( !$this->testSshConnection( $remoteUser, $remoteHost, $sshPort, $sshKeyPath ) ) {
			return;
		}

		$direction = $this->choice( 'Sync direction?', [ 'Pull from production', 'Push to production' ], 0 );

		if ( $direction === 'Pull from production' ) {
			$this->handlePull(
				$remoteUser, $remoteHost, $sshPort, $sshKeyPath,
				$remoteDbUser, $remoteDbPassword, $remoteDbName, $remoteBasePath,
				$localDbHost, $localDbPort, $localDbUser, $localDbPassword, $localDbName, $localBasePath,
				$remoteDumpFile, $localDumpFile, $publicStoragePaths
			);
		} else {
			$this->handlePush(
				$remoteUser, $remoteHost, $sshPort, $sshKeyPath,
				$remoteDbUser, $remoteDbPassword, $remoteDbName, $remoteBasePath,
				$localDbHost, $localDbPort, $localDbUser, $localDbPassword, $localDbName, $localBasePath,
				$remoteDumpFile, $localDumpFile, $remoteBackupFile, $publicStoragePaths
			);
		}
	}

	protected function handlePull(
		$remoteUser, $remoteHost, $sshPort, $sshKeyPath,
		$remoteDbUser, $remoteDbPassword, $remoteDbName, $remoteBasePath,
		$localDbHost, $localDbPort, $localDbUser, $localDbPassword, $localDbName, $localBasePath,
		$remoteDumpFile, $localDumpFile, $publicStoragePaths
	): void {
		$syncSource = $this->choice( 'What do you want to pull?', [ 'Whole database', 'Specific DB table(s)', 'Public storage', 'Specific folder' ], 0 );

		switch ( $syncSource ) {
			case 'Whole database':
				$this->info( 'Pulling whole database from production...' );
				$this->info( 'Dumping remote database...' );
				if ( !$this->sshExec(
					$remoteUser,
					$remoteHost,
					$sshPort,
					$sshKeyPath,
					sprintf(
						'mysqldump -u%s -p%s %s > %s',
						escapeshellarg( $remoteDbUser ),
						escapeshellarg( $remoteDbPassword ),
						escapeshellarg( $remoteDbName ),
						escapeshellarg( $remoteDumpFile ),
					),
				) ) {
					return;
				}
				$this->info( 'Downloading dump file...' );
				if ( !$this->sshScp( $remoteUser, $remoteHost, $sshPort, $sshKeyPath, $remoteDumpFile, $localDumpFile ) ) {
					return;
				}
				$this->info( 'Importing dump file...' );
				$this->importToLocalDatabase( $localDbHost, $localDbPort, $localDbUser, $localDbPassword, $localDbName, $localDumpFile );
				$this->cleanupLocalDump( $localDumpFile );
				$this->info( '✅ Done!' );
				break;

			case 'Specific DB table(s)':
				$tables    = $this->ask( 'Enter the table names (comma-separated):' );
				$tableList = array_map( 'trim', explode( ',', $tables ) );
				$this->info( 'Pulling specific database tables from production...' );
				$this->info( 'Dumping remote tables...' );
				if ( !$this->sshExec(
					$remoteUser,
					$remoteHost,
					$sshPort,
					$sshKeyPath,
					sprintf(
						'mysqldump -u%s -p%s %s %s > %s',
						escapeshellarg( $remoteDbUser ),
						escapeshellarg( $remoteDbPassword ),
						escapeshellarg( $remoteDbName ),
						implode( ' ', array_map( 'escapeshellarg', $tableList ) ),
						escapeshellarg( $remoteDumpFile ),
					),
				) ) {
					return;
				}
				$this->info( 'Downloading dump file...' );
				if ( !$this->sshScp( $remoteUser, $remoteHost, $sshPort, $sshKeyPath, $remoteDumpFile, $localDumpFile ) ) {
					return;
				}
				$this->info( 'Importing dump file...' );
				$this->importToLocalDatabase( $localDbHost, $localDbPort, $localDbUser, $localDbPassword, $localDbName, $localDumpFile );
				$this->cleanupLocalDump( $localDumpFile );
				$this->info( '✅ Done!' );
				break;

			case 'Public storage':
				$this->info( 'Pulling public storage from production...' );
				foreach ( $publicStoragePaths as $folder ) {
					$remoteFolder = $remoteBasePath . $folder;
					$localFolder  = $localBasePath . $folder;
					if ( !is_dir( $localFolder ) ) {
						mkdir( $localFolder, 0777, true );
					}
					$this->info( 'Syncing: ' . $remoteFolder . ' -> ' . $localFolder );
					if ( !$this->rsyncPull( $remoteUser, $remoteHost, $sshPort, $sshKeyPath, $remoteFolder, $localFolder ) ) {
						return;
					}
				}
				$this->info( '✅ Public storage pulled successfully.' );
				break;

			case 'Specific folder':
				$folder       = $this->ask( 'Enter the folder path (relative to project root):' );
				$remoteFolder = $remoteBasePath . '/' . ltrim( $folder, '/' );
				$localFolder  = $localBasePath . '/' . ltrim( $folder, '/' );
				if ( !is_dir( $localFolder ) ) {
					mkdir( $localFolder, 0777, true );
				}
				$this->info( 'Pulling folder from production...' );
				if ( !$this->rsyncPull( $remoteUser, $remoteHost, $sshPort, $sshKeyPath, $remoteFolder, $localFolder ) ) {
					return;
				}
				$this->info( '✅ Folder pulled successfully.' );
				break;
		}
	}

	protected function handlePush(
		$remoteUser, $remoteHost, $sshPort, $sshKeyPath,
		$remoteDbUser, $remoteDbPassword, $remoteDbName, $remoteBasePath,
		$localDbHost, $localDbPort, $localDbUser, $localDbPassword, $localDbName, $localBasePath,
		$remoteDumpFile, $localDumpFile, $remoteBackupFile, $publicStoragePaths
	): void {
		$syncSource = $this->choice( 'What do you want to push?', [ 'Whole database', 'Specific DB table(s)', 'Public storage', 'Specific folder' ], 0 );

		switch ( $syncSource ) {
			case 'Whole database':
				$this->warn( '⚠️  WARNING: This will REPLACE the entire production database!' );
				$this->warn( '⚠️  A backup will be created first, but this is a destructive operation.' );

				if ( !$this->confirm( 'Are you sure you want to push your local database to production?', false ) ) {
					$this->info( 'Operation cancelled.' );
					return;
				}

				// Double confirmation for safety
				$confirmText = $this->ask( 'Type "PUSH TO PRODUCTION" to confirm:' );
				if ( $confirmText !== 'PUSH TO PRODUCTION' ) {
					$this->info( 'Operation cancelled.' );
					return;
				}

				$this->info( 'Creating backup of production database...' );
				if ( !$this->sshExec(
					$remoteUser,
					$remoteHost,
					$sshPort,
					$sshKeyPath,
					sprintf(
						'mysqldump -u%s -p%s %s > %s',
						escapeshellarg( $remoteDbUser ),
						escapeshellarg( $remoteDbPassword ),
						escapeshellarg( $remoteDbName ),
						escapeshellarg( $remoteBackupFile ),
					),
				) ) {
					return;
				}
				$this->info( 'Backup saved to: ' . $remoteBackupFile );

				$this->info( 'Dumping local database...' );
				if ( !$this->dumpLocalDatabase( $localDbHost, $localDbPort, $localDbUser, $localDbPassword, $localDbName, $localDumpFile ) ) {
					return;
				}

				$this->info( 'Uploading dump file to production...' );
				if ( !$this->scpPush( $remoteUser, $remoteHost, $sshPort, $sshKeyPath, $localDumpFile, $remoteDumpFile ) ) {
					$this->cleanupLocalDump( $localDumpFile );
					return;
				}

				$this->info( 'Importing to production database...' );
				if ( !$this->sshExec(
					$remoteUser,
					$remoteHost,
					$sshPort,
					$sshKeyPath,
					sprintf(
						'mysql -u%s -p%s %s < %s',
						escapeshellarg( $remoteDbUser ),
						escapeshellarg( $remoteDbPassword ),
						escapeshellarg( $remoteDbName ),
						escapeshellarg( $remoteDumpFile ),
					),
				) ) {
					$this->cleanupLocalDump( $localDumpFile );
					return;
				}

				$this->cleanupLocalDump( $localDumpFile );
				$this->info( '✅ Database pushed to production successfully!' );
				$this->info( 'Backup location: ' . $remoteBackupFile );
				break;

			case 'Specific DB table(s)':
				$tables    = $this->ask( 'Enter the table names (comma-separated):' );
				$tableList = array_map( 'trim', explode( ',', $tables ) );

				$this->warn( '⚠️  WARNING: This will REPLACE these tables in production: ' . implode( ', ', $tableList ) );

				if ( !$this->confirm( 'Are you sure you want to push these tables to production?', false ) ) {
					$this->info( 'Operation cancelled.' );
					return;
				}

				$this->info( 'Creating backup of production tables...' );
				if ( !$this->sshExec(
					$remoteUser,
					$remoteHost,
					$sshPort,
					$sshKeyPath,
					sprintf(
						'mysqldump -u%s -p%s %s %s > %s',
						escapeshellarg( $remoteDbUser ),
						escapeshellarg( $remoteDbPassword ),
						escapeshellarg( $remoteDbName ),
						implode( ' ', array_map( 'escapeshellarg', $tableList ) ),
						escapeshellarg( $remoteBackupFile ),
					),
				) ) {
					return;
				}
				$this->info( 'Backup saved to: ' . $remoteBackupFile );

				$this->info( 'Dumping local tables...' );
				if ( !$this->dumpLocalDatabase( $localDbHost, $localDbPort, $localDbUser, $localDbPassword, $localDbName, $localDumpFile, $tableList ) ) {
					return;
				}

				$this->info( 'Uploading dump file to production...' );
				if ( !$this->scpPush( $remoteUser, $remoteHost, $sshPort, $sshKeyPath, $localDumpFile, $remoteDumpFile ) ) {
					$this->cleanupLocalDump( $localDumpFile );
					return;
				}

				$this->info( 'Importing to production database...' );
				if ( !$this->sshExec(
					$remoteUser,
					$remoteHost,
					$sshPort,
					$sshKeyPath,
					sprintf(
						'mysql -u%s -p%s %s < %s',
						escapeshellarg( $remoteDbUser ),
						escapeshellarg( $remoteDbPassword ),
						escapeshellarg( $remoteDbName ),
						escapeshellarg( $remoteDumpFile ),
					),
				) ) {
					$this->cleanupLocalDump( $localDumpFile );
					return;
				}

				$this->cleanupLocalDump( $localDumpFile );
				$this->info( '✅ Tables pushed to production successfully!' );
				$this->info( 'Backup location: ' . $remoteBackupFile );
				break;

			case 'Public storage':
				$this->warn( '⚠️  WARNING: This will sync local storage files to production.' );

				if ( !$this->confirm( 'Are you sure you want to push local storage to production?', false ) ) {
					$this->info( 'Operation cancelled.' );
					return;
				}

				$this->info( 'Pushing public storage to production...' );
				foreach ( $publicStoragePaths as $folder ) {
					$localFolder  = $localBasePath . $folder;
					$remoteFolder = $remoteBasePath . $folder;
					if ( !is_dir( $localFolder ) ) {
						$this->warn( 'Local folder does not exist: ' . $localFolder );
						continue;
					}
					$this->info( 'Syncing: ' . $localFolder . ' -> ' . $remoteFolder );
					if ( !$this->rsyncPush( $remoteUser, $remoteHost, $sshPort, $sshKeyPath, $localFolder, $remoteFolder ) ) {
						return;
					}
				}
				$this->info( '✅ Public storage pushed to production successfully!' );
				break;

			case 'Specific folder':
				$folder       = $this->ask( 'Enter the folder path (relative to project root):' );
				$localFolder  = $localBasePath . '/' . ltrim( $folder, '/' );
				$remoteFolder = $remoteBasePath . '/' . ltrim( $folder, '/' );

				if ( !is_dir( $localFolder ) ) {
					$this->error( 'Local folder does not exist: ' . $localFolder );
					return;
				}

				$this->warn( '⚠️  WARNING: This will sync local folder to production.' );

				if ( !$this->confirm( 'Are you sure you want to push this folder to production?', false ) ) {
					$this->info( 'Operation cancelled.' );
					return;
				}

				$this->info( 'Pushing folder to production...' );
				if ( !$this->rsyncPush( $remoteUser, $remoteHost, $sshPort, $sshKeyPath, $localFolder, $remoteFolder ) ) {
					return;
				}
				$this->info( '✅ Folder pushed to production successfully!' );
				break;
		}
	}

	protected function sshExec( $user, $host, $port, $keyPath, $command ): bool
	{
		$sshCommand = sprintf(
			'ssh -o PasswordAuthentication=no -o PubkeyAuthentication=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=no -i %s -p %d %s@%s %s 2>&1',
			escapeshellarg( $keyPath ),
			$port,
			escapeshellarg( $user ),
			escapeshellarg( $host ),
			escapeshellarg( $command ),
		);
		exec( $sshCommand, $output, $exitCode );

		if ( $exitCode !== 0 ) {
			$this->error( 'SSH command failed with exit code: ' . $exitCode );
			$this->error( implode( "\n", $output ) );
			return false;
		}
		return true;
	}

	protected function sshScp( $user, $host, $port, $keyPath, $remoteFilePath, $localFilePath ): bool
	{
		$scpCommand = sprintf(
			'scp -o PasswordAuthentication=no -o PubkeyAuthentication=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=no -i %s -P %d %s@%s:%s %s 2>&1',
			escapeshellarg( $keyPath ),
			$port,
			escapeshellarg( $user ),
			escapeshellarg( $host ),
			escapeshellarg( $remoteFilePath ),
			escapeshellarg( $localFilePath ),
		);
		exec( $scpCommand, $output, $exitCode );

		if ( $exitCode !== 0 ) {
			$this->error( 'SCP download failed with exit code: ' . $exitCode );
			$this->error( implode( "\n", $output ) );
			return false;
		}
		return true;
	}

	protected function scpPush( $user, $host, $port, $keyPath, $localFilePath, $remoteFilePath ): bool
	{
		// Use rsync for single file upload (more reliable than scp on some servers)
		$remoteDir = dirname( $remoteFilePath );
		$rsyncCommand = sprintf(
			'rsync -avz -e "ssh -o PasswordAuthentication=no -o PubkeyAuthentication=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=no -i %s -p %d" %s %s@%s:%s/ 2>&1',
			escapeshellarg( $keyPath ),
			$port,
			escapeshellarg( $localFilePath ),
			escapeshellarg( $user ),
			escapeshellarg( $host ),
			escapeshellarg( $remoteDir ),
		);
		exec( $rsyncCommand, $output, $exitCode );

		if ( $exitCode !== 0 ) {
			$this->error( 'File upload failed with exit code: ' . $exitCode );
			$this->error( implode( "\n", $output ) );
			return false;
		}
		return true;
	}

	protected function importToLocalDatabase( $host, $port, $user, $password, $database, $inputFile ): void
	{
		if ( empty( $password ) ) {
			$importCommand = sprintf(
				'mysql -h %s -P %d -u %s %s < %s',
				escapeshellarg( $host ),
				$port,
				escapeshellarg( $user ),
				escapeshellarg( $database ),
				escapeshellarg( $inputFile ),
			);
		} else {
			$importCommand = sprintf(
				'mysql -h %s -P %d -u %s -p%s %s < %s',
				escapeshellarg( $host ),
				$port,
				escapeshellarg( $user ),
				escapeshellarg( $password ),
				escapeshellarg( $database ),
				escapeshellarg( $inputFile ),
			);
		}
		exec( $importCommand );
	}

	protected function dumpLocalDatabase( $host, $port, $user, $password, $database, $outputFile, $tables = [] ): bool
	{
		$tableString = !empty( $tables ) ? implode( ' ', array_map( 'escapeshellarg', $tables ) ) : '';

		if ( empty( $password ) ) {
			$dumpCommand = sprintf(
				'mysqldump -h %s -P %d -u %s %s %s > %s 2>&1',
				escapeshellarg( $host ),
				$port,
				escapeshellarg( $user ),
				escapeshellarg( $database ),
				$tableString,
				escapeshellarg( $outputFile ),
			);
		} else {
			$dumpCommand = sprintf(
				'mysqldump -h %s -P %d -u %s -p%s %s %s > %s 2>&1',
				escapeshellarg( $host ),
				$port,
				escapeshellarg( $user ),
				escapeshellarg( $password ),
				escapeshellarg( $database ),
				$tableString,
				escapeshellarg( $outputFile ),
			);
		}
		exec( $dumpCommand, $output, $exitCode );

		if ( $exitCode !== 0 ) {
			$this->error( 'Local database dump failed with exit code: ' . $exitCode );
			$this->error( implode( "\n", $output ) );
			return false;
		}

		if ( !file_exists( $outputFile ) ) {
			$this->error( 'Local dump file was not created: ' . $outputFile );
			return false;
		}

		$fileSize = filesize( $outputFile );
		if ( $fileSize === 0 ) {
			$this->error( 'Local dump file is empty: ' . $outputFile );
			return false;
		}

		$this->line( '  Dump file size: ' . $this->formatBytes( $fileSize ) );
		return true;
	}

	protected function formatBytes( $bytes, $precision = 2 ): string
	{
		$units = [ 'B', 'KB', 'MB', 'GB' ];
		$bytes = max( $bytes, 0 );
		$pow   = floor( ( $bytes ? log( $bytes ) : 0 ) / log( 1024 ) );
		$pow   = min( $pow, count( $units ) - 1 );
		$bytes /= pow( 1024, $pow );
		return round( $bytes, $precision ) . ' ' . $units[ $pow ];
	}

	protected function cleanupLocalDump( $localDumpFile ): void
	{
		if ( file_exists( $localDumpFile ) ) {
			unlink( $localDumpFile );
		}
	}

	protected function rsyncPull( $user, $host, $port, $keyPath, $remoteFolder, $localFolder ): bool
	{
		$rsyncCommand = sprintf(
			'rsync -avz -e "ssh -o PasswordAuthentication=no -o PubkeyAuthentication=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=no -i %s -p %d" %s@%s:%s/ %s/ 2>&1',
			escapeshellarg( $keyPath ),
			$port,
			escapeshellarg( $user ),
			escapeshellarg( $host ),
			escapeshellarg( $remoteFolder ),
			escapeshellarg( $localFolder ),
		);
		exec( $rsyncCommand, $output, $exitCode );

		if ( $exitCode !== 0 ) {
			$this->error( 'Rsync pull failed with exit code: ' . $exitCode );
			$this->error( implode( "\n", $output ) );
			return false;
		}
		return true;
	}

	protected function rsyncPush( $user, $host, $port, $keyPath, $localFolder, $remoteFolder ): bool
	{
		$rsyncCommand = sprintf(
			'rsync -avz -e "ssh -o PasswordAuthentication=no -o PubkeyAuthentication=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=no -i %s -p %d" %s/ %s@%s:%s/ 2>&1',
			escapeshellarg( $keyPath ),
			$port,
			escapeshellarg( $localFolder ),
			escapeshellarg( $user ),
			escapeshellarg( $host ),
			escapeshellarg( $remoteFolder ),
		);
		exec( $rsyncCommand, $output, $exitCode );

		if ( $exitCode !== 0 ) {
			$this->error( 'Rsync push failed with exit code: ' . $exitCode );
			$this->error( implode( "\n", $output ) );
			return false;
		}
		return true;
	}

	protected function validateConfig( $sshKeyPath, $localBasePath, $remoteBasePath ): bool
	{
		$errors = [];

		if ( empty( $sshKeyPath ) ) {
			$errors[] = 'APPSYNC_SSHKEY_PATH is not set';
		} elseif ( !file_exists( $sshKeyPath ) ) {
			$errors[] = 'SSH key not found at: ' . $sshKeyPath;
		}

		if ( empty( $localBasePath ) ) {
			$errors[] = 'APPSYNC_LOCAL_BASEPATH is not set';
		} elseif ( !is_dir( $localBasePath ) ) {
			$errors[] = 'Local base path not found: ' . $localBasePath;
		}

		if ( empty( $remoteBasePath ) ) {
			$errors[] = 'APPSYNC_REMOTE_BASEPATH is not set';
		}

		if ( !empty( $errors ) ) {
			$this->error( '❌ Configuration errors:' );
			foreach ( $errors as $error ) {
				$this->line( '  • ' . $error );
			}
			$this->newLine();
			$this->warn( 'Please check your .env file and ensure all APPSYNC_* variables are set correctly.' );
			return false;
		}

		return true;
	}

	protected function testLocalDatabase( $host, $port, $user, $password, $database ): bool
	{
		$this->info( 'Testing local database connection...' );

		if ( empty( $database ) ) {
			$this->error( '❌ APPSYNC_LOCAL_DBNAME is not set in .env' );
			return false;
		}

		if ( empty( $host ) ) {
			$this->error( '❌ APPSYNC_LOCAL_DBHOST is not set in .env' );
			return false;
		}

		// Try to connect using mysqli
		try {
			$mysqli = @new mysqli( $host, $user, $password ?? '', $database, (int) $port );

			if ( $mysqli->connect_error ) {
				$this->error( '❌ Local database connection failed!' );
				$this->error( '  Error: ' . $mysqli->connect_error );
				$this->newLine();
				$this->warn( 'Troubleshooting tips:' );
				$this->line( '  1. Check APPSYNC_LOCAL_DBNAME exists: ' . $database );
				$this->line( '  2. Check APPSYNC_LOCAL_DBHOST: ' . $host );
				$this->line( '  3. Check APPSYNC_LOCAL_DBPORT: ' . $port );
				$this->line( '  4. Check APPSYNC_LOCAL_DBUSER: ' . $user );
				$this->line( '  5. Check APPSYNC_LOCAL_DBPASSWORD is correct' );
				$this->line( '  6. Ensure MySQL/MariaDB is running' );
				return false;
			}

			$mysqli->close();
		} catch ( Exception $e ) {
			$this->error( '❌ Local database connection failed!' );
			$this->error( '  Error: ' . $e->getMessage() );
			return false;
		}

		$this->info( '✅ Local database connection successful!' );
		return true;
	}

	protected function testSshConnection( $user, $host, $port, $keyPath ): bool
	{
		$this->info( 'Testing SSH connection...' );

		$sshCommand = sprintf(
			'ssh -o PasswordAuthentication=no -o PubkeyAuthentication=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=no -o ConnectTimeout=10 -i %s -p %d %s@%s "echo connected" 2>&1',
			escapeshellarg( $keyPath ),
			$port,
			escapeshellarg( $user ),
			escapeshellarg( $host ),
		);
		exec( $sshCommand, $output, $exitCode );

		if ( $exitCode !== 0 ) {
			$this->error( '❌ SSH connection failed!' );
			$this->error( implode( "\n", $output ) );
			$this->newLine();
			$this->warn( 'Troubleshooting tips:' );
			$this->line( '  1. Check APPSYNC_SSHKEY_PATH is the full path (not ~)' );
			$this->line( '  2. Verify key exists: ls -la ' . $keyPath );
			$this->line( '  3. Check key permissions: chmod 600 ' . $keyPath );
			$this->line( '  4. Test manually: ssh -i ' . $keyPath . ' ' . $user . '@' . $host );
			$this->line( '  5. Ensure public key is in server\'s ~/.ssh/authorized_keys' );
			return false;
		}

		$this->info( '✅ SSH connection successful!' );
		return true;
	}
}
