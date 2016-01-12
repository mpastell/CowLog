pandoc help.md -S --toc --toc-depth=4 --base-header-level=4 --template help_template.txt -o ../html/help.html
pandoc help.md -S --toc --toc-depth=4 --base-header-level=4 --template online_help_template.txt -o "$COWLOG_WEBSITE"/help.html
