library(plyr);library(dplyr)

library(ggplot2)
library(scales)
library(reshape2)

setwd('D:/workspace/lottery')

lottery = read.csv('lottery_bigsim.csv')

lottery_trials = lottery %>% filter(prize_row_id==8)

ggplot(lottery_trials %>% filter(total_tickets_sold==500000000)) + 
  geom_line(aes(x=ticket_price, y=expected_utility_change, color=net_worth, group=net_worth)) + 
  facet_wrap(~pool_size)

# kind of rough, calculate break-even points
lottery_trials = lottery_trials %>% filter(total_tickets_sold==500000000) 

lottery_breakeven = lottery_trials %>%
  group_by(net_worth, pool_size) %>%
  summarize(min_price=ticket_price[expected_utility_change >= 0][which.min(expected_utility_change[expected_utility_change >= 0])],
            utility=expected_utility_change[expected_utility_change >= 0][which.min(expected_utility_change[expected_utility_change >= 0])])

lottery_breakeven$pool_size = factor(lottery_breakeven$pool_size, levels = c(1,5,10,25,50,100,200,10000,20000))


ggplot(lottery_breakeven) + geom_line(aes(x=net_worth, y=min_price, color=pool_size, group=pool_size)) + 
  scale_x_log10('Net Worth (USD)', label=dollar, breaks=c(10000,25000,50000, 100000,500000,1000000)) + 
  scale_y_continuous('Ticket Price for Breakeven Expected Utility', label=dollar) + 
  ggtitle('Powerball® Ticket Value versus Purchaser Net Worth and Size of Pool',
          subtitle='Expected utility is E(log(net_worth)), rather than E(net_worth), which is a better metric for usefulness of outcomes\nPool size is the total number of people (including purchaser) who split all winnings they earn') +
  NULL

## megamillions
lottery2 = read.csv('lottery_megamillions3.csv')

lottery2_trials = lottery2 %>% filter(prize_row_id==0)


# kind of rough, calculate break-even points
lottery2_trials = lottery2_trials %>% filter(total_tickets_sold==300000000) 

lottery2_breakeven = lottery2_trials %>%
  group_by(net_worth, pool_size) %>%
  summarize(min_price=ticket_price[expected_utility_change >= 0][which.min(expected_utility_change[expected_utility_change >= 0])],
            utility=expected_utility_change[expected_utility_change >= 0][which.min(expected_utility_change[expected_utility_change >= 0])])

lottery2_breakeven$pool_size = factor(lottery2_breakeven$pool_size, levels = c(1,5,10,25,50,100,200,10000,20000))


ggplot(lottery2_breakeven) + geom_line(aes(x=net_worth, y=min_price, color=pool_size, group=pool_size), lwd=2) + 
  scale_x_log10('Net Worth (USD)', label=dollar, breaks=c(10000,25000,50000, 100000,500000,1000000)) + 
  scale_y_continuous('Ticket Price for Breakeven Expected Utility', label=dollar) + 
  ggtitle('Megamillions® Ticket Value versus Purchaser Net Worth and Size of Pool',
          subtitle='Expected utility is E(log(net_worth)), rather than E(net_worth), which is a better metric for usefulness of outcomes\nPool size is the total number of people (including purchaser) who split all winnings they earn') +
  NULL


save(list=c('lottery_breakeven','lottery2_breakeven'), file='lottery_breakdown.RData')
