#!/usr/bin/env ruby

require 'date'
require 'json'

commits = ARGF.read
            .split(/commit \w+/)[1..-1]
            .map do |commit_string|
              lines = commit_string.strip.split("\n")
              date_line = lines.find { |l| l.include? "Date" }
              date_str = date_line.gsub(/^Date:\s+/, '')
              message = lines[2..-1].map(&:strip).join("\n").strip
              begin
                date = DateTime.parse(date_str)
              rescue ArgumentError
              end
              { date: date, message: message }
            end
            .select do |commit|
              !commit[:message].include?("Merge ")
            end
            .group_by do |commit|
              commit[:date].to_date
            end
puts JSON.generate(commits)