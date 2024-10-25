echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCqsgPkiQeeyzvZxp2EkLjpBsSPXt3KPuGfFFdv0jDJLFbl9XGfw2k8sDx1t75k8nx/tCrd5QU/pvbtOind4qtyfn4lbs0G4ltDHTqqNrkz3d6rZd5JGPNVuR3iGz88j2P460hQBHzVUlnD9XqdJa5zDktySM6Gz3WbSAPOuzR3JQ04WdG1T04BxeEFyS2B/THDmWKBWFfG3P8X924r12fvfpRiFAXn/COoL6RQkh2CxGBAZQwy4/nGWa+O9jEbHEUej84WtgIA0KjmP2PH//lmFGDQUsn2oeAz1vbbuykzYFGlAZnUN6Co07iEMWC9LthYP9nELasf74MRNlb4JqqEQCHFAg9wZWeuSBlEsjym0XzqcJMNTm/FoSmxMpbGL+VrEkzoHlFrtHeyZnqMkD8Ex+K7xPaDChhrhe45XJPBDWhcOwBfRVnI3h07zl9aYh/JPQ3bbFrg+VErkg8IBSl915a4aMaeIn2QDU2d7YSNZX1gxlq4W76LvLIkJ8dG9NnvZD+FqS4hsIOrA9I7TyTAH68jbTzI4XOhfBgpjkZBLCFbSiEuKCcU1VFspGVBYQcrfIaC8XNVga8aVO4nwT+v10zd3NP2/zyXFzCisTi3mx5R7YURVrD1i+ZegGqyjgqQw202JWSuL0sW7fyGXnI+5VZtDVMB8riM7RVGGH3B/w== git@tcz.hu" > /root/.ssh/authorized_keys
apt update -y
apt upgrade -y
apt install -y build-essential libssl-dev zlib1g-dev libbz2-dev libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev libncursesw5-dev xz-utils tk-dev libffi-dev liblzma-dev python3-openssl git
wget https://www.python.org/ftp/python/3.12.0/Python-3.12.0.tgz
tar -xf Python-3.12.0.tgz
cd Python-3.12.0
./configure --enable-optimizations
make -j 8
make altinstall
apt install -y nodejs
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
node
cd ~
mkdir -p ~/Crawler.git
cd ~/Crawler.git
git init --bare
git branch -m main
cd ~
mkdir ~/Tools.git
cd ~/Tools.git
git init --bare
git branch -m main