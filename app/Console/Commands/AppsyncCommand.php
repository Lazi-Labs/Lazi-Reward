<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class AppsyncCommand extends Command
{
	protected $signature = 'appsync';

	protected $description = 'Sync remote database and/or files with local';

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

		$publicStoragePaths = [ '/public/assets' ];

		$syncSource = $this->choice( 'What do you want to sync?', [ 'Whole database', 'Specific DB table(s)', 'Public storage', 'Specific folder' ], 0 );

		switch ( $syncSource ) {
			case 'Whole database':
				$this->info( 'Syncing whole database...' );
				sleep( 1 );
				$this->info( 'Dumping remote database...' );
				$this->sshExec(
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
				);
				$this->info( 'Downloading dump file...' );
				$this->sshScp( $remoteUser, $remoteHost, $sshPort, $sshKeyPath, $remoteDumpFile, $localDumpFile );
				$this->info( 'Importing dump file...' );
				$this->importToLocalDatabase( $localDbHost, $localDbPort, $localDbUser, $localDbPassword, $localDbName, $localDumpFile );
				$this->info( 'Done!' );

				break;

			case 'Specific DB table(s)':
				$tables    = $this->ask( 'Enter the table names (comma-separated):' );
				$tableList = explode( ',', $tables );
				$this->info( 'Syncing specific database tables...' );
				sleep( 1 );
				$this->info( 'Dumping remote database...' );
				$this->sshExec(
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
				);
				$this->info( 'Downloading dump file...' );
				$this->sshScp( $remoteUser, $remoteHost, $sshPort, $sshKeyPath, $remoteDumpFile, $localDumpFile );
				$this->info( 'Importing dump file...' );
				$this->importToLocalDatabase( $localDbHost, $localDbPort, $localDbUser, $localDbPassword, $localDbName, $localDumpFile );
				$this->info( 'Done!' );

				break;

			case 'Public storage':
				$this->info( 'Syncing public storage...' );
				foreach ( $publicStoragePaths as $folder ) {
					$remoteFolder = $remoteBasePath . $folder;
					$localFolder  = $localBasePath . $folder;
					if ( !is_dir( $localFolder ) ) {
						mkdir( $localFolder, 0777, true );
					}
					$this->info( 'Syncing folder: ' . $remoteFolder . ' to ' . $localFolder );
					$this->rsyncFolder( $remoteUser, $remoteHost, $sshPort, $sshKeyPath, $remoteFolder, $localFolder );
				}
				$this->info( 'Public storage synchronized successfully.' );

				break;

			case 'Specific folder':
				$folder = $this->ask( 'Enter the folder path (relative to project root ' . $remoteBasePath . '):' );
				$this->info( 'Syncing specific folder...' );
				$remoteFolder = $remoteBasePath . $folder;
				$localFolder  = $localBasePath . $folder;
				if ( !is_dir( $localFolder ) ) {
					mkdir( $localFolder, 0777, true );
				}
				$this->rsyncFolder( $remoteUser, $remoteHost, $sshPort, $sshKeyPath, $remoteFolder, $localFolder );
				$this->info( 'Folder synchronized successfully.' );

				break;
		}

		if ( !in_array( $syncSource, [ 'Public storage', 'Specific folder' ] ) && file_exists( $localDumpFile ) ) {
			unlink( $localDumpFile );
		}
	}

	protected function sshExec( $user, $host, $port, $keyPath, $command ): void
	{
		$sshCommand = sprintf(
			'ssh -o PasswordAuthentication=no -o PubkeyAuthentication=yes -o IdentitiesOnly=yes -i %s -p %d %s@%s %s',
			escapeshellarg( $keyPath ),
			$port,
			escapeshellarg( $user ),
			escapeshellarg( $host ),
			escapeshellarg( $command ),
		);
		exec( $sshCommand );
	}

	protected function sshScp( $user, $host, $port, $keyPath, $remoteFilePath, $localFilePath ): void
	{
		$scpCommand = sprintf(
			'scp -o PasswordAuthentication=no -o PubkeyAuthentication=yes -o IdentitiesOnly=yes -i %s -P %d %s@%s:%s %s',
			escapeshellarg( $keyPath ),
			$port,
			escapeshellarg( $user ),
			escapeshellarg( $host ),
			escapeshellarg( $remoteFilePath ),
			escapeshellarg( $localFilePath ),
		);
		exec( $scpCommand );
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

	protected function rsyncFolder( $user, $host, $port, $keyPath, $remoteFolder, $localFolder ): void
	{
		$rsyncCommand = sprintf(
			'rsync -avz -e "ssh -o PasswordAuthentication=no -o PubkeyAuthentication=yes -o IdentitiesOnly=yes -i %s -p %d" %s@%s:%s/ %s/',
			escapeshellarg( $keyPath ),
			$port,
			escapeshellarg( $user ),
			escapeshellarg( $host ),
			escapeshellarg( $remoteFolder ),
			escapeshellarg( $localFolder ),
		);

		exec( $rsyncCommand );
	}
}
